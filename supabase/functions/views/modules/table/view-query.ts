import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { notFound } from "../../shared/errors.ts";
import { loadViewRecord } from "../../shared/supabase.ts";
import { q } from "../../shared/query.ts";
import { resolveGroupValueClause } from "../../shared/group-filter.ts";
import {
  assertViewDomainMatch,
  viewTypeMatchesRecord,
} from "../../shared/validation.ts";
import {
  buildTableExternalRules,
  collectTableRequiredFieldIds,
  resolveTableDisplayConfig,
  resolveTableOrderBy,
} from "./filters.ts";

export async function resolveTableViewQuery(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const viewDataId = ctx.viewDataId;
  if (!viewDataId) {
    throw new Error("viewDataId is required");
  }

  const view = await loadViewRecord(ctx.supabase, viewDataId);
  if (!view) notFound(`View not found: ${viewDataId}`);

  assertViewDomainMatch(view.domain, domain.key, domain.dbDomainValue);

  if (!viewTypeMatchesRecord(ctx.viewType, view.view_type_key, view.display_config)) {
    throw new Error(
      `View type "${ctx.viewType}" does not match view record type "${view.view_type_key}"`,
    );
  }

  const displayConfig = resolveTableDisplayConfig(view.display_config);
  const externalRules = buildTableExternalRules(view, displayConfig, domain);
  let where = domain.buildWhereFromRules(externalRules, ctx.companyId);

  const groupField = ctx.searchParams.get("groupField")?.trim();
  const groupValue = ctx.searchParams.get("groupValue");
  if (groupField && groupValue != null && String(groupValue).trim() !== "") {
    const groupClause = await resolveGroupValueClause(
      ctx,
      domain,
      groupField,
      String(groupValue),
    );
    where = where ? q.and(where, groupClause) : groupClause;
  }

  const orderBy = resolveTableOrderBy(ctx, displayConfig, domain);
  const fieldIds = collectTableRequiredFieldIds(view, displayConfig, domain);
  if (orderBy?.field) fieldIds.add(orderBy.field);

  return {
    view,
    displayConfig,
    fieldIds,
    where,
    orderBy,
  };
}

export function mergeWhereClauses(
  base: QueryClause | undefined,
  extra: QueryClause | undefined,
): QueryClause | undefined {
  if (!extra) return base;
  if (!base) return extra;
  return q.and(base, extra);
}
