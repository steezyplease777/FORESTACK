import type { DataDomainModule, ViewRequestContext } from "./types.ts";
import {
  buildGroupValueClause,
  cmp,
  isUuid,
  type QueryClause,
} from "./query.ts";

/** Forces an empty result when a group token cannot be resolved. */
const EMPTY_RESULT_ID = "00000000-0000-0000-0000-000000000000";

async function lookupOptionIdByName(
  ctx: ViewRequestContext,
  optionsTable: string,
  name: string,
): Promise<string | null> {
  let qb = ctx.supabase
    .from(optionsTable)
    .select("id")
    .eq("name", name)
    .limit(1);
  if (ctx.companyId) qb = qb.eq("company_id", ctx.companyId);
  const { data } = await qb;
  const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
  const id = row?.id ? String(row.id) : null;
  return id && isUuid(id) ? id : null;
}

/**
 * Build a where clause for a single group section fetch.
 * Linked-field group tokens are display names (e.g. "PENDING") — resolve
 * them to FK UUIDs so PostgREST never receives text on a uuid column.
 */
export async function resolveGroupValueClause(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
  groupField: string,
  groupValue: string,
): Promise<QueryClause> {
  const fieldKey = domain.filterFieldAliases[groupField] || groupField;
  const meta = domain.fieldMap[fieldKey];
  const val = String(groupValue).trim();

  if (!val) {
    return cmp("id", "eq", EMPTY_RESULT_ID);
  }

  const needsNameLookup =
    !!meta?.optionsTable &&
    !isUuid(val) &&
    (meta.kind === "linked" || meta.kind === "projects");

  if (needsNameLookup) {
    const id = await lookupOptionIdByName(ctx, meta.optionsTable!, val);
    if (id) return cmp(fieldKey, "eq", id);
    return cmp("id", "eq", EMPTY_RESULT_ID);
  }

  return buildGroupValueClause(fieldKey, val, domain.fieldMap);
}
