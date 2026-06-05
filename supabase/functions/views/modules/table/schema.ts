import type { DataDomainModule } from "../../shared/types.ts";

export function getTableEditorSchema(domain: DataDomainModule) {
  return {
    renderer: "table",
    properties: {
      showHeader: { type: "boolean", default: true },
      enableSearch: { type: "boolean", default: true },
      enableFilters: { type: "boolean", default: true },
      enableCsvExport: { type: "boolean", default: true },
      enableColumnsPicker: { type: "boolean", default: false },
      density: {
        type: "enum",
        options: ["compact", "default", "comfortable"],
        default: "default",
      },
      columns: {
        type: "array",
        items: { type: "string" },
        description: "Ordered column field ids (optional; fields[] is canonical for editor)",
      },
      sorting: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            direction: { type: "enum", options: ["asc", "desc"] },
          },
        },
      },
      rowActions: { type: "array", items: { type: "object" } },
      fields: {
        type: "array",
        description: "Per-column visibility, order, and embedded filters",
        items: {
          type: "object",
          properties: {
            fieldId: { type: "string" },
            fieldName: { type: "string" },
            fieldIndex: { type: "number" },
            visible: { type: "boolean" },
            filters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  operator: { type: "string" },
                  value: {},
                },
              },
            },
          },
        },
      },
    },
    domainFieldIds: domain.fields.map((f) => f.id),
  };
}

export const TABLE_AGGREGATION_OPTIONS = [
  { id: "count", label: "Count" },
  { id: "sum", label: "Sum", appliesTo: ["number"] },
];

export const TABLE_FILTER_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "in",
  "not_in",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "before",
  "after",
  "today",
  "last_n_days",
  "is_empty",
  "is_not_empty",
];
