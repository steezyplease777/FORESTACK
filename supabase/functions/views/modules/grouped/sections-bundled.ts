import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { badRequest } from "../../shared/errors.ts";
import { parseJsonBody } from "../../shared/request.ts";
import { q } from "../../shared/query.ts";
import { resolveGroupValueClause } from "../../shared/group-filter.ts";
import { resolveGroupedViewQuery } from "./view-query.ts";
import { resolveEffectiveGroupBy } from "./filters.ts";

export type GroupSectionPageRequest = {
  groupValue: string;
  page: number;
};

export type GroupSectionPageResult = {
  rows: Record<string, unknown>[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number | null;
    hasMore: boolean;
  };
};

const MAX_SECTIONS_PER_REQUEST = 50;

export async function parseGroupSectionRequests(
  ctx: ViewRequestContext,
): Promise<GroupSectionPageRequest[]> {
  const rawParam = ctx.searchParams.get("sections")?.trim();
  if (rawParam) {
    try {
      const parsed = JSON.parse(rawParam) as unknown;
      return normalizeSectionRequests(parsed);
    } catch {
      badRequest("Invalid sections query param — expected JSON array");
    }
  }

  if (ctx.req.method !== "GET" && ctx.req.method !== "HEAD") {
    const body = await parseJsonBody<{ sections?: unknown }>(ctx.req);
    if (body.sections) {
      return normalizeSectionRequests(body.sections);
    }
  }

  return [];
}

function normalizeSectionRequests(raw: unknown): GroupSectionPageRequest[] {
  if (!Array.isArray(raw)) {
    badRequest("sections must be an array of { groupValue, page }");
  }
  const out: GroupSectionPageRequest[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const groupValue = String(rec.groupValue ?? rec.value ?? "").trim();
    if (!groupValue) continue;
    const page = Math.max(0, Number(rec.page) || 0);
    out.push({ groupValue, page });
  }
  if (!out.length) {
    badRequest("sections array is empty or invalid");
  }
  if (out.length > MAX_SECTIONS_PER_REQUEST) {
    badRequest(`Too many sections in one request (max ${MAX_SECTIONS_PER_REQUEST})`);
  }
  return out;
}

async function fetchOneGroupSection(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
  resolved: Awaited<ReturnType<typeof resolveGroupedViewQuery>>,
  groupField: string,
  req: GroupSectionPageRequest,
  pageSize: number,
): Promise<GroupSectionPageResult> {
  const page = Math.max(0, req.page);
  const offset = page * pageSize;

  const groupClause = await resolveGroupValueClause(
    ctx,
    domain,
    groupField,
    req.groupValue,
  );
  const where = resolved.where
    ? q.and(resolved.where, groupClause)
    : groupClause;

  const catalogs = await domain.loadCatalogs(
    ctx,
    Array.from(resolved.fieldIds),
  );

  const { rows: rawRows, totalCount } = await domain.fetchRecords(ctx, {
    view: resolved.view,
    displayConfig: resolved.displayConfig,
    fieldIds: resolved.fieldIds,
    where,
    orderBy: resolved.orderBy,
    offset,
    limit: pageSize,
  });

  const rows = rawRows.map((raw) => domain.mapRow(raw, catalogs));

  return {
    rows,
    meta: {
      page,
      pageSize,
      totalCount,
      hasMore: totalCount != null
        ? offset + rows.length < totalCount
        : rows.length >= pageSize,
    },
  };
}

export async function handleBundledGroupSections(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
  sectionRequests: GroupSectionPageRequest[],
) {
  const resolved = await resolveGroupedViewQuery(ctx, domain);
  const groupBy = resolveEffectiveGroupBy(ctx, domain, resolved.displayConfig);
  if (!groupBy) {
    badRequest("groupBy is required for bundled section fetches");
  }

  const groupFieldParam = ctx.searchParams.get("groupField")?.trim() || groupBy;
  const groupField =
    domain.filterFieldAliases[groupFieldParam] || groupFieldParam;

  const pageSize = ctx.pageSize;
  const sections: Record<string, GroupSectionPageResult> = {};

  const results = await Promise.all(
    sectionRequests.map(async (req) => {
      const result = await fetchOneGroupSection(
        ctx,
        domain,
        resolved,
        groupField,
        req,
        pageSize,
      );
      return { groupValue: req.groupValue, result };
    }),
  );

  for (const { groupValue, result } of results) {
    sections[groupValue] = result;
  }

  return {
    rows: [],
    meta: {
      page: 0,
      pageSize,
      totalCount: null,
      hasMore: false,
    },
    renderer: "grouped" as const,
    groupBy,
    sections,
  };
}
