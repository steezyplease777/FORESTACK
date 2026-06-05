import type { DataDomainModule, TableDisplayConfig } from "../../shared/types.ts";
import { EXPENSE_TABLE_DEFAULT_FIELDS } from "../table/defaults.ts";

/** Default grouped renderer settings merged into display_config on view create. */
export const GROUPED_RENDERER_DEFAULTS: TableDisplayConfig = {
  renderer: "grouped",
  showHeader: true,
  enableSearch: true,
  enableFilters: true,
  enableGrouping: true,
  enableCsvExport: true,
  enableColumnsPicker: false,
  defaultGroupBy: "status",
  groupHeaderColors: [
    { value: "SENT FOR APPROVAL", textColor: "#dc2626", backgroundColor: "#ffbcb3" },
    { value: "APPROVED FOR PAYMENT", textColor: "#3b82f6", backgroundColor: "#dbeafe" },
    { value: "PENDING", textColor: "#f59e0b", backgroundColor: "#fef3c7" },
    { value: "NOT APPROVED", textColor: "#d92626", backgroundColor: "#fee2e2" },
    { value: "PAID", textColor: "#10b981", backgroundColor: "#d1fae5" },
  ],
  columns: [],
  sorting: [],
  filters: [],
  grouping: [{ field: "status" }],
  rowActions: [],
  density: "default",
};

export function getGroupedDefaultDisplayConfig(
  _domain: DataDomainModule,
  existing?: Partial<TableDisplayConfig>,
): TableDisplayConfig {
  const fields = existing?.fields?.length
    ? existing.fields
    : EXPENSE_TABLE_DEFAULT_FIELDS;

  const defaultGroupBy =
    (typeof existing?.defaultGroupBy === "string" && existing.defaultGroupBy.trim())
      ? existing.defaultGroupBy.trim()
      : GROUPED_RENDERER_DEFAULTS.defaultGroupBy as string;

  const grouping = existing?.grouping?.length
    ? existing.grouping
    : [{ field: defaultGroupBy }];

  const groupHeaderColors = existing?.groupHeaderColors?.length
    ? existing.groupHeaderColors
    : GROUPED_RENDERER_DEFAULTS.groupHeaderColors;

  return {
    ...GROUPED_RENDERER_DEFAULTS,
    fields,
    ...existing,
    renderer: "grouped",
    enableGrouping: true,
    defaultGroupBy,
    grouping: existing?.grouping?.length ? existing.grouping : grouping,
    groupHeaderColors,
  };
}
