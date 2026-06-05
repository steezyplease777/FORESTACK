import type {
  DataDomainModule,
  ExternalFilterRule,
  TableDisplayConfig,
  ViewRecord,
  ViewRequestContext,
} from "../../shared/types.ts";
import {
  coerceExternalRuleValue,
  type OrderClause,
} from "../../shared/query.ts";

export function resolveTableDisplayConfig(
  raw: Record<string, unknown> | null | undefined,
): TableDisplayConfig {
  if (!raw || typeof raw !== "object") return { renderer: "table" };
  return raw as TableDisplayConfig;
}

export function collectTableRequiredFieldIds(
  view: ViewRecord,
  displayConfig: TableDisplayConfig,
  domain: DataDomainModule,
): Set<string> {
  const ids = new Set<string>();

  for (const f of displayConfig.fields ?? []) {
    if (f.visible === false) continue;
    if (f.fieldId) ids.add(f.fieldId);
    for (const flt of f.filters ?? []) {
      if (f.fieldId) ids.add(f.fieldId);
      void flt;
    }
  }

  for (const col of displayConfig.columns ?? []) {
    if (col) ids.add(String(col));
  }

  for (const s of displayConfig.sorting ?? []) {
    if (s?.field) ids.add(s.field);
  }

  for (const g of displayConfig.grouping ?? []) {
    if (g?.field) ids.add(g.field);
  }

  for (const r of displayConfig.filters ?? []) {
    if (r?.field) ids.add(String(r.field));
  }

  for (const r of view.filters ?? []) {
    if (r?.field) ids.add(String(r.field));
  }

  // Always need id + title for row identity / open actions.
  ids.add("id");
  if (ids.size <= 1) {
    for (const f of domain.fields.slice(0, 8)) ids.add(f.id);
  }

  return ids;
}

export function buildTableExternalRules(
  view: ViewRecord,
  displayConfig: TableDisplayConfig,
  domain: DataDomainModule,
): ExternalFilterRule[] {
  const rules: ExternalFilterRule[] = [];
  const push = (field: string, op: string, value: unknown) => {
    if (!field || !op) return;
    const alias = domain.filterFieldAliases[field] || field;
    rules.push({ field: alias, operator: op, value });
  };

  for (const f of displayConfig.fields ?? []) {
    for (const flt of f.filters ?? []) {
      if (!flt) continue;
      const opRaw = String(flt.operator || "");
      const coerced = coerceExternalRuleValue(opRaw, flt.value);
      if (!coerced) continue;
      const needsValue = coerced.op !== "today" &&
        coerced.op !== "is_empty" &&
        coerced.op !== "is_not_empty";
      if (
        needsValue &&
        (coerced.value == null ||
          coerced.value === "" ||
          (Array.isArray(coerced.value) && coerced.value.length === 0))
      ) {
        continue;
      }
      push(f.fieldId, coerced.op, coerced.value);
    }
  }

  for (const r of view.filters ?? []) {
    if (!r || r.active === false || !r.field || !r.operator) continue;
    const coerced = coerceExternalRuleValue(String(r.operator), r.value);
    if (!coerced) continue;
    push(String(r.field), coerced.op, coerced.value);
  }

  for (const r of displayConfig.filters ?? []) {
    if (!r || r.active === false || !r.field || !r.operator) continue;
    const coerced = coerceExternalRuleValue(String(r.operator), r.value);
    if (!coerced) continue;
    push(String(r.field), coerced.op, coerced.value);
  }

  return rules;
}

export function buildTableOrderBy(
  displayConfig: TableDisplayConfig,
  _domain: DataDomainModule,
): OrderClause | undefined {
  const first = displayConfig.sorting?.[0];
  if (!first?.field) return undefined;
  return {
    __k: "order" as const,
    field: first.field,
    dir: (first.direction === "desc" ? "desc" : "asc") as "asc" | "desc",
  };
}

/** Interactive header sort overrides saved display_config.sorting when valid. */
export function resolveTableOrderBy(
  ctx: ViewRequestContext,
  displayConfig: TableDisplayConfig,
  domain: DataDomainModule,
): OrderClause | undefined {
  const sortFieldRaw =
    ctx.searchParams.get("sortField")?.trim() ||
    ctx.searchParams.get("sortBy")?.trim();
  const sortDirRaw =
    ctx.searchParams.get("sortDir")?.trim() ||
    ctx.searchParams.get("sortDirection")?.trim() ||
    ctx.searchParams.get("order")?.trim();

  if (sortFieldRaw) {
    const fieldKey = domain.filterFieldAliases[sortFieldRaw] || sortFieldRaw;
    const meta = domain.fieldMap[fieldKey];
    if (meta?.sortColumn) {
      const dir = sortDirRaw?.toLowerCase() === "desc" ? "desc" : "asc";
      return { __k: "order", field: fieldKey, dir };
    }
  }

  return buildTableOrderBy(displayConfig, domain);
}

export {
  buildTableExternalRules as buildExternalRules,
  buildTableOrderBy as buildOrderBy,
  collectTableRequiredFieldIds as collectRequiredFieldIds,
  resolveTableDisplayConfig as resolveDisplayConfig,
};
