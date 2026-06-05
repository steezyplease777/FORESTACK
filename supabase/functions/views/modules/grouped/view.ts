import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { fetchExpenseChartAggregate } from "../../domains/expense/chart-aggregate.ts";
import { resolveEffectiveGroupBy } from "./filters.ts";
import { resolveGroupedViewQuery } from "./view-query.ts";
import {
  handleBundledGroupSections,
  parseGroupSectionRequests,
} from "./sections-bundled.ts";

export type GroupedViewGroupSummary = {
  value: string;
  label: string;
  count: number;
  [metricKey: string]: string | number;
};

/**
 * Grouped view fetch strategy:
 * - No groupField/groupValue → groups summary only (no row scan).
 * - With groupField + groupValue → paginated rows for that section.
 */
export async function handleGroupedView(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const sectionRequests = await parseGroupSectionRequests(ctx);
  if (sectionRequests.length > 0) {
    return handleBundledGroupSections(ctx, domain, sectionRequests);
  }

  const groupFieldParam = ctx.searchParams.get("groupField")?.trim();
  const groupValue = ctx.searchParams.get("groupValue");
  const isSectionFetch =
    !!groupFieldParam &&
    groupValue != null &&
    String(groupValue).trim() !== "";

  const resolved = await resolveGroupedViewQuery(ctx, domain);
  const groupBy = resolveEffectiveGroupBy(ctx, domain, resolved.displayConfig);

  if (!isSectionFetch) {
    let groups: GroupedViewGroupSummary[] = [];
    if (domain.key === "expense" && groupBy) {
      const rows = await fetchExpenseChartAggregate(ctx, {
        where: resolved.where,
        groupField: groupBy,
        sumFields: [],
      });
      groups = rows.map((row) => ({
        value: String(row.value ?? row.groupBy ?? ""),
        label: String(row.label ?? row.value ?? row.groupBy ?? ""),
        count: row.count,
        ...row,
      }));
    }

    const totalCount = groups.reduce((sum, g) => sum + (g.count || 0), 0);

    return {
      rows: [],
      meta: {
        page: ctx.page,
        pageSize: ctx.pageSize,
        totalCount,
        hasMore: false,
      },
      renderer: "grouped",
      groupBy,
      groups,
    };
  }

  const page = ctx.page;
  const pageSize = ctx.pageSize;
  const offset = page * pageSize;

  const catalogs = await domain.loadCatalogs(
    ctx,
    Array.from(resolved.fieldIds),
  );

  const { rows: rawRows, totalCount } = await domain.fetchRecords(ctx, {
    view: resolved.view,
    displayConfig: resolved.displayConfig,
    fieldIds: resolved.fieldIds,
    where: resolved.where,
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
    renderer: "grouped",
    groupBy,
  };
}
