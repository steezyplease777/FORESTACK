import type {
  DataDomainModule,
  DomainCatalogs,
  DomainQueryResult,
  UtilityRequestContext,
  ViewRequestContext,
} from "../../shared/types.ts";
import {
  applyClauseToBuilder,
  applyOrderToBuilder,
  buildWhereFromExternalRules,
  collectInnerJoins,
  collectInnerJoinsFromOrderBy,
  type OrderClause,
  type QueryClause,
} from "../../shared/query.ts";
import {
  buildExpenseFieldDefinitions,
  buildExpenseSelect,
  EXPENSE_FIELD_MAP,
  EXPENSE_FILTER_FIELD_ALIASES,
  EXPENSE_TABLE,
  EXPENSE_TAGS,
} from "./fields.ts";
import { mapExpenseRow } from "./map-row.ts";
import { EXPENSE_VIEW_TYPE_PRESETS } from "./view-type-presets.ts";

async function loadTagsCatalog(
  ctx: ViewRequestContext,
  companyId: string | null,
): Promise<Map<string, string>> {
  const tagsById = new Map<string, string>();
  let qb = ctx.supabase.from(EXPENSE_TAGS).select("id,name").limit(5000);
  if (companyId) qb = qb.eq("company_id", companyId);
  const { data } = await qb;
  for (const row of data ?? []) {
    if (row?.id && row?.name) tagsById.set(String(row.id), String(row.name));
  }
  return tagsById;
}

export const expenseDomain: DataDomainModule = {
  key: "expense",
  slug: "expense",
  label: "Expense",
  dbDomainValue: "expense",
  primaryTable: EXPENSE_TABLE,
  fields: buildExpenseFieldDefinitions(),
  fieldMap: EXPENSE_FIELD_MAP,
  filterFieldAliases: EXPENSE_FILTER_FIELD_ALIASES,

  buildSelect: buildExpenseSelect,

  buildWhereFromRules(rules, _companyId) {
    return buildWhereFromExternalRules(rules);
  },

  async fetchRecords(ctx, args): Promise<DomainQueryResult> {
    const innerSet = new Set<string>();
    collectInnerJoins(args.where, EXPENSE_FIELD_MAP, innerSet);
    collectInnerJoinsFromOrderBy(args.orderBy, EXPENSE_FIELD_MAP, innerSet);

    const select = buildExpenseSelect(args.fieldIds ?? new Set(), innerSet);
    let qb = ctx.supabase.from(EXPENSE_TABLE).select(select, { count: "exact" });

    qb = applyClauseToBuilder(qb, args.where, EXPENSE_FIELD_MAP);

    const companyId = ctx.companyId ?? args.view.company_id;
    if (companyId) qb = qb.eq("company_id", companyId);

    qb = applyOrderToBuilder(qb, args.orderBy, EXPENSE_FIELD_MAP);
    qb = qb.range(args.offset, args.offset + args.limit - 1);

    const { data, error, count } = await qb;
    if (error) {
      throw new Error(`Expense query failed: ${error.message}`);
    }

    return {
      rows: (Array.isArray(data) ? data : []) as unknown as Record<string, unknown>[],
      totalCount: typeof count === "number" ? count : null,
    };
  },

  mapRow: mapExpenseRow,

  async loadCatalogs(ctx, fieldIds): Promise<DomainCatalogs> {
    const needsTags = fieldIds.includes("invoiceTags") ||
      fieldIds.some((id) => EXPENSE_FIELD_MAP[id]?.kind === "jsonb_arr");
    const tagsById = needsTags
      ? await loadTagsCatalog(ctx, ctx.companyId)
      : new Map<string, string>();
    return { tagsById };
  },

  async fetchDistinctFilterValues(
    ctx: UtilityRequestContext,
    fieldId: string,
  ): Promise<Array<{ id: string; label: string }>> {
    const meta = EXPENSE_FIELD_MAP[fieldId];
    if (!meta) return [];

    const companyId = ctx.companyId;

    if (meta.kind === "jsonb_text" && meta.attributeKey) {
      let qb = ctx.supabase
        .from(EXPENSE_TABLE)
        .select(`attributes->>${meta.attributeKey}`)
        .limit(2000);
      if (companyId) qb = qb.eq("company_id", companyId);
      const { data } = await qb;
      const seen = new Set<string>();
      for (const row of data ?? []) {
        const rec = row as unknown as Record<string, unknown>;
        const v = rec[meta.attributeKey];
        if (typeof v === "string" && v.trim()) seen.add(v.trim());
      }
      return Array.from(seen)
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ id: v, label: v }));
    }

    if (meta.optionsTable) {
      const cols = ["id", "name", ...(meta.optionsExtra ?? [])].join(",");
      let qb = ctx.supabase
        .from(meta.optionsTable)
        .select(cols)
        .order("name", { ascending: true })
        .limit(1000);
      if (companyId) qb = qb.eq("company_id", companyId);
      const { data } = await qb;
      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      return rows.map((r) => ({
        id: String(r.id),
        label: String(r.name ?? r.id),
      }));
    }

    return [];
  },

  viewTypePresets: EXPENSE_VIEW_TYPE_PRESETS,
};

export type ExpenseFetchArgs = {
  where?: QueryClause;
  orderBy?: OrderClause;
  offset: number;
  limit: number;
  fieldIds: Set<string>;
};
