import type {
  DataDomainModule,
  ExternalFilterRule,
  TableDisplayConfig,
  ViewRecord,
  ViewRequestContext,
} from "../../shared/types.ts";
import {
  buildTableExternalRules,
  buildTableOrderBy,
  collectTableRequiredFieldIds,
} from "../table/filters.ts";

export function resolveGroupedDisplayConfig(
  raw: Record<string, unknown> | null | undefined,
): TableDisplayConfig {
  if (!raw || typeof raw !== "object") {
    return { renderer: "grouped", grouping: [{ field: "status" }], defaultGroupBy: "status" };
  }
  const cfg = raw as TableDisplayConfig;
  const defaultGroupBy =
    (typeof cfg.defaultGroupBy === "string" && cfg.defaultGroupBy.trim())
      ? cfg.defaultGroupBy.trim()
      : cfg.grouping?.[0]?.field || "status";
  return {
    ...cfg,
    renderer: "grouped",
    enableGrouping: true,
    defaultGroupBy,
    grouping: cfg.grouping?.length ? cfg.grouping : [{ field: defaultGroupBy }],
  };
}

/** Saved display_config, overridden by ?groupBy= or ?defaultGroupBy= when groupable. */
export function resolveEffectiveGroupBy(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
  displayConfig: TableDisplayConfig,
): string | null {
  const override =
    ctx.searchParams.get("groupBy")?.trim() ||
    ctx.searchParams.get("defaultGroupBy")?.trim();
  const fromConfig =
    (typeof displayConfig.defaultGroupBy === "string" && displayConfig.defaultGroupBy.trim())
      ? displayConfig.defaultGroupBy.trim()
      : displayConfig.grouping?.[0]?.field || null;
  const candidate = override || fromConfig;
  if (!candidate) return null;

  const fieldKey = domain.filterFieldAliases[candidate] || candidate;
  const meta = domain.fieldMap[fieldKey];
  if (meta?.groupable !== true) {
    return domain.fields.find((f) => f.groupable)?.id ?? null;
  }
  return fieldKey;
}

export function collectGroupedRequiredFieldIds(
  view: ViewRecord,
  displayConfig: TableDisplayConfig,
  domain: DataDomainModule,
): Set<string> {
  const ids = collectTableRequiredFieldIds(view, displayConfig, domain);
  const groupField =
    displayConfig.grouping?.[0]?.field ||
    (typeof displayConfig.defaultGroupBy === "string" ? displayConfig.defaultGroupBy : "");
  if (groupField) ids.add(groupField);
  return ids;
}

export {
  buildTableExternalRules as buildGroupedExternalRules,
  buildTableOrderBy as buildGroupedOrderBy,
};
