import type {
  DataDomainModule,
  TableDisplayConfig,
  ViewTypeKey,
} from "../../shared/types.ts";
import { getViewModule } from "../index.ts";
import {
  TABLE_AGGREGATION_OPTIONS,
  TABLE_FILTER_OPERATORS,
} from "./schema.ts";

export function buildRendererContext(
  viewType: ViewTypeKey,
  domain: DataDomainModule,
  displayConfigRaw: Record<string, unknown> | null | undefined,
) {
  const mod = getViewModule(viewType);
  if (!mod) {
    throw new Error(`View type module not registered: ${viewType}`);
  }

  const displayConfig = mod.resolveDisplayConfig(displayConfigRaw);
  const filterableFields = domain.fields.filter((f) => f.filterable);
  const sortableFields = domain.fields.filter((f) => f.sortable);
  const groupableFields = domain.fields.filter((f) => f.groupable);
  const relationshipFields = domain.fields.filter((f) => f.relationship);

  return {
    renderer: {
      type: viewType,
      schema: mod.getEditorSchema(domain),
      editorUi: mod.getEditorUiSchema(domain),
      defaults: mod.getDefaultDisplayConfig(domain),
      filterOperators: TABLE_FILTER_OPERATORS,
      aggregationOptions: TABLE_AGGREGATION_OPTIONS.filter((opt) => {
        if (opt.id !== "sum") return true;
        return domain.fields.some((f) => f.aggregatable);
      }),
      currentConfig: displayConfig as TableDisplayConfig,
    },
    domain: {
      id: domain.slug,
      key: domain.key,
      label: domain.label,
      fields: domain.fields,
      filterableFields,
      sortableFields,
      groupableFields,
      relationshipFields,
      viewTypePresets: domain.viewTypePresets ?? [],
    },
    utilities: {
      columns: domain.fields.map((f) => ({
        id: f.id,
        label: f.label,
        kind: f.kind,
      })),
      filterableFields,
      sortableFields,
      relationshipFields,
    },
  };
}

/** @deprecated Use buildRendererContext(viewType, domain, raw) */
export function buildTableRendererContext(
  domain: DataDomainModule,
  displayConfigRaw: Record<string, unknown> | null | undefined,
) {
  return buildRendererContext("table", domain, displayConfigRaw);
}
