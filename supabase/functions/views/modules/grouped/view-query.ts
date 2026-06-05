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
  buildGroupedExternalRules,
  buildGroupedOrderBy,
  collectGroupedRequiredFieldIds,
  resolveGroupedDisplayConfig,
} from "./filters.ts";

export async function resolveGroupedViewQuery(
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

  const displayConfig = resolveGroupedDisplayConfig(view.display_config);
  const rawGroupBy =
    (typeof displayConfig.defaultGroupBy === "string" && displayConfig.defaultGroupBy.trim())
      ? displayConfig.defaultGroupBy.trim()
      : displayConfig.grouping?.[0]?.field || "status";
  const groupMeta = domain.fieldMap[domain.filterFieldAliases[rawGroupBy] || rawGroupBy];
  const defaultGroupBy = groupMeta?.groupable === true
    ? rawGroupBy
    : (domain.fields.find((f) => f.groupable)?.id ?? "status");
  if (defaultGroupBy !== rawGroupBy) {
    displayConfig.defaultGroupBy = defaultGroupBy;
    displayConfig.grouping = [{ field: defaultGroupBy }];
  }
  const fieldIds = collectGroupedRequiredFieldIds(view, displayConfig, domain);
  const externalRules = buildGroupedExternalRules(view, displayConfig, domain);
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

  const orderBy = buildGroupedOrderBy(displayConfig, domain);

  return {
    view,
    displayConfig,
    fieldIds,
    where,
    orderBy,
  };
}
