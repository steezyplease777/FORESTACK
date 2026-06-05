import type { ViewRequestContext } from "../../shared/types.ts";
import {
  applyClauseToBuilder,
  collectInnerJoins,
  type QueryClause,
} from "../../shared/query.ts";
import {
  buildExpenseSelect,
  EXPENSE_FIELD_MAP,
  EXPENSE_TABLE,
} from "./fields.ts";

export type ChartAggregateRow = {
  groupBy: string;
  /** Stable key passed to groupField/groupValue section fetches. */
  value: string;
  /** Human-readable header text (may equal value for label-mode fields). */
  label: string;
  count: number;
  [metricKey: string]: string | number;
};

async function loadOptionLabelMap(
  ctx: ViewRequestContext,
  optionsTable: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let qb = ctx.supabase.from(optionsTable).select("id,name").limit(5000);
  if (ctx.companyId) qb = qb.eq("company_id", ctx.companyId);
  const { data } = await qb;
  for (const row of data ?? []) {
    if (row?.id && row?.name) map.set(String(row.id), String(row.name));
  }
  return map;
}

function tokensOf(
  row: Record<string, unknown>,
  groupField: string,
): string[] {
  const gmeta = EXPENSE_FIELD_MAP[groupField];
  if (!gmeta) return [];

  switch (gmeta.kind) {
    case "linked": {
      const rel = gmeta.selectFragment?.split(":")[0] ?? "";
      const relObj = row[rel] as { name?: string } | null | undefined;
      const name = relObj?.name;
      return name ? [String(name)] : [];
    }
    case "projects": {
      const eps = Array.isArray(row.expense_projects)
        ? row.expense_projects as Array<{
          project_id?: string;
          project?: { id?: string; name?: string };
        }>
        : [];
      const out: string[] = [];
      for (const ep of eps) {
        const name = ep?.project?.name?.trim();
        if (name) {
          out.push(name);
          continue;
        }
        const id = ep?.project_id || ep?.project?.id;
        if (id) out.push(String(id));
      }
      return out;
    }
    case "jsonb_arr": {
      const arr = Array.isArray(row.tags) ? row.tags : [];
      return arr.map(String).filter(Boolean);
    }
    case "jsonb_text":
    case "enum": {
      if (gmeta.attributeKey) {
        const attrs = row.attributes as Record<string, unknown> | null | undefined;
        const v = attrs?.[gmeta.attributeKey];
        return v != null && v !== "" ? [String(v)] : [];
      }
      const col = gmeta.filterColumn.split(".")[0];
      const v = row[col];
      return v != null && v !== "" ? [String(v)] : [];
    }
    default: {
      const col = gmeta.filterColumn.split(".")[0];
      const v = row[col];
      return v != null && v !== "" ? [String(v)] : [];
    }
  }
}

export async function fetchExpenseChartAggregate(
  ctx: ViewRequestContext,
  args: {
    where?: QueryClause;
    groupField: string;
    sumFields?: string[];
  },
): Promise<ChartAggregateRow[]> {
  const groupField = args.groupField;
  const sumFields = args.sumFields ?? [];
  const gmeta = EXPENSE_FIELD_MAP[groupField];
  if (!gmeta || gmeta.groupable !== true) return [];

  const innerSet = new Set<string>();
  if (args.where) collectInnerJoins(args.where, EXPENSE_FIELD_MAP, innerSet);

  const frags = new Set<string>(["id"]);
  if (gmeta.selectFragment) frags.add(gmeta.selectFragment);
  if (gmeta.kind === "jsonb_text" || gmeta.kind === "enum") frags.add("attributes");
  if (gmeta.kind === "jsonb_arr") frags.add("tags");
  if (gmeta.kind === "projects") frags.add(gmeta.selectFragment!);

  for (const sf of sumFields) {
    const fmeta = EXPENSE_FIELD_MAP[sf];
    if (fmeta?.selectFragment) frags.add(fmeta.selectFragment);
  }

  const selectStr = Array.from(frags)
    .map((frag) => {
      const relationKey = frag.split("(")[0];
      return innerSet.has(relationKey)
        ? frag.replace(/^([a-z_]+:[a-z_]+)\(/i, "$1!inner(")
        : frag;
    })
    .join(",");

  let qb = ctx.supabase.from(EXPENSE_TABLE).select(selectStr).limit(10000);
  qb = applyClauseToBuilder(qb, args.where, EXPENSE_FIELD_MAP);
  const companyId = ctx.companyId;
  if (companyId) qb = qb.eq("company_id", companyId);

  const { data, error } = await qb;
  const rows: Record<string, unknown>[] = error
    ? []
    : (Array.isArray(data) ? data : []) as Record<string, unknown>[];

  const agg = new Map<string, { count: number; sums: Record<string, number> }>();

  for (const row of rows) {
    for (const token of tokensOf(row, groupField)) {
      let entry = agg.get(token);
      if (!entry) {
        entry = { count: 0, sums: {} };
        agg.set(token, entry);
      }
      entry.count += 1;
      for (const sf of sumFields) {
        const fmeta = EXPENSE_FIELD_MAP[sf];
        const colKey = fmeta?.selectFragment?.includes("(")
          ? sf
          : (fmeta?.selectFragment ?? sf);
        const raw = row[colKey];
        const n = typeof raw === "number" ? raw : Number(raw);
        if (Number.isFinite(n)) {
          const key = `sum_${sf}`;
          entry.sums[key] = (entry.sums[key] || 0) + n;
        }
      }
    }
  }

  let labelByValue: Map<string, string> | null = null;
  if (gmeta.groupTokenMode === "id" && gmeta.optionsTable) {
    labelByValue = await loadOptionLabelMap(ctx, gmeta.optionsTable);
  }

  return Array.from(agg.entries()).map(([token, entry]) => {
    const label = labelByValue?.get(token) ?? token;
    return {
      [groupField]: token,
      groupBy: token,
      value: token,
      label,
      count: entry.count,
      ...entry.sums,
    };
  });
}
