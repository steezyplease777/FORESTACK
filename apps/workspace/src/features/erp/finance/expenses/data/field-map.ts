/** Semantic field keys → Supabase columns (mirrors edge fn EXPENSE_FIELD_MAP). */

export const EXPENSE_SORT_COLUMNS = [
  'created_at',
  'title',
  'amount',
  'status_id',
  'vendor_id',
  'category_id',
  'payment_type',
  'invoice_date',
] as const

export type ExpenseSortColumn = (typeof EXPENSE_SORT_COLUMNS)[number]

/** URL `sort` param / server `sortColumn` → PostgREST `.order()` column. */
export const EXPENSE_ORDER_COLUMN_BY_SORT: Record<ExpenseSortColumn, string> = {
  created_at: 'created_at',
  title: 'title',
  amount: 'amount',
  status_id: 'status_id',
  vendor_id: 'vendor_id',
  category_id: 'category_id',
  payment_type: 'attributes->>payment_type',
  invoice_date: 'attributes->>invoice_date',
}

export function isExpenseSortColumn(value: string): value is ExpenseSortColumn {
  return (EXPENSE_SORT_COLUMNS as readonly string[]).includes(value)
}

export function sortColumnForTableColumn(
  columnId: string,
): ExpenseSortColumn | undefined {
  const meta = EXPENSE_FIELD_MAP[columnId]
  const col = meta?.sortColumn
  if (col && isExpenseSortColumn(col)) return col
  if (columnId === 'submittedAt') return 'created_at'
  return undefined
}

export const EXPENSE_TABLE = 'erp_expenses'
export const EXPENSE_STATUSES = 'erp_expense_statuses'
export const EXPENSE_VENDORS = 'erp_vendors'
export const EXPENSE_CATEGORIES = 'erp_expense_categories'
export const EXPENSE_TAGS = 'erp_expense_tags'
export const EXPENSE_PROJECTS_JUNCTION = 'erp_expense_projects'
export const EXPENSE_DOCUMENTS = 'erp_expense_documents'

export type ExpenseFieldMeta = {
  kind: string
  filterColumn?: string
  sortColumn?: string
  fkColumn?: string
  attributeKey?: string
}

export const EXPENSE_FIELD_MAP: Record<string, ExpenseFieldMeta> = {
  title: { kind: 'text', filterColumn: 'title', sortColumn: 'title' },
  amount: { kind: 'number', filterColumn: 'amount', sortColumn: 'amount' },
  status: {
    kind: 'linked',
    filterColumn: 'status_id',
    sortColumn: 'status_id',
    fkColumn: 'status_id',
  },
  vendor: {
    kind: 'linked',
    filterColumn: 'vendor_id',
    sortColumn: 'vendor_id',
    fkColumn: 'vendor_id',
  },
  expenseCategory: {
    kind: 'linked',
    filterColumn: 'category_id',
    sortColumn: 'category_id',
    fkColumn: 'category_id',
  },
  submittedAt: {
    kind: 'datetime',
    filterColumn: 'created_at',
    sortColumn: 'created_at',
  },
  department: {
    kind: 'jsonb_text',
    filterColumn: 'attributes->>department',
    attributeKey: 'department',
  },
  relatedProject: {
    kind: 'projects',
    filterColumn: 'expense_projects.project_id',
  },
  paymentType: {
    kind: 'jsonb_text',
    filterColumn: 'attributes->>payment_type',
    sortColumn: 'payment_type',
    attributeKey: 'payment_type',
  },
  invoiceDate: {
    kind: 'jsonb_text',
    filterColumn: 'attributes->>invoice_date',
    sortColumn: 'invoice_date',
    attributeKey: 'invoice_date',
  },
}

export const EXPENSE_UPDATE_FIELD_MAP: Record<string, string> = {
  title: 'title',
  amount: 'amount',
  status: 'status_id',
  vendor: 'vendor_id',
  expenseCategory: 'category_id',
}
