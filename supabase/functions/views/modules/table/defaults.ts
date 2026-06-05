import type { DataDomainModule, TableDisplayConfig } from "../../shared/types.ts";

/** Default table renderer settings merged into display_config on view create. */
export const TABLE_RENDERER_DEFAULTS: TableDisplayConfig = {
  renderer: "table",
  showHeader: true,
  enableSearch: true,
  enableFilters: true,
  enableCsvExport: true,
  enableColumnsPicker: false,
  columns: [],
  sorting: [],
  filters: [],
  rowActions: [],
  density: "default",
};

/** Legacy default columns for expense/invoice table views (matches nav block). */
export const EXPENSE_TABLE_DEFAULT_FIELDS = [
  { fieldId: "title", filters: [], fieldName: "Title", fieldIndex: 0 },
  { fieldId: "amount", filters: [], fieldName: "Amount", fieldIndex: 1 },
  { fieldId: "invoiceDate", filters: [], fieldName: "Invoice Date", fieldIndex: 4 },
  { fieldId: "status", filters: [], fieldName: "Status", fieldIndex: 3 },
  { fieldId: "submittedBy", filters: [], fieldName: "Submitted By", fieldIndex: 5 },
  { fieldId: "expenseCategory", filters: [], fieldName: "Category", fieldIndex: 6 },
  { fieldId: "department", filters: [], fieldName: "Department", fieldIndex: 7 },
  { fieldId: "vendor", filters: [], fieldName: "Vendor", fieldIndex: 8 },
  { fieldId: "relatedProject", filters: [], fieldName: "Project", fieldIndex: 9 },
  { fieldId: "documents", filters: [], fieldName: "Documents", fieldIndex: 10 },
  { fieldId: "createdAt", filters: [], fieldName: "Submitted At", fieldIndex: 11 },
  { fieldId: "expenseAssignment", filters: [], fieldName: "Expense Assignment", fieldIndex: 12 },
  { fieldId: "invoicePaidDate", filters: [], fieldName: "Invoice Paid Date", fieldIndex: 13 },
  { fieldId: "invoiceTags", filters: [], fieldName: "Tags", fieldIndex: 14 },
];

export function getTableDefaultDisplayConfig(
  _domain: DataDomainModule,
  existing?: Partial<TableDisplayConfig>,
): TableDisplayConfig {
  const fields = existing?.fields?.length
    ? existing.fields
    : EXPENSE_TABLE_DEFAULT_FIELDS;

  return {
    ...TABLE_RENDERER_DEFAULTS,
    fields,
    ...existing,
    renderer: "table",
  };
}

export function mergeTableDefaultsIntoDisplayConfig(
  raw: Record<string, unknown> | null | undefined,
  domain: DataDomainModule,
): TableDisplayConfig {
  const existing = (raw && typeof raw === "object") ? raw as TableDisplayConfig : {};
  return getTableDefaultDisplayConfig(domain, existing);
}
