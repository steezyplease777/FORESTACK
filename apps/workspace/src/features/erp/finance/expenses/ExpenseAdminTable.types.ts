import type {
  ExpenseDocument,
  ExpenseRecord,
  ExpenseStatus,
} from '@/lib/data/erp/expenses/types'

export type ExpenseTableColumnId =
  | 'title'
  | 'status'
  | 'amount'
  | 'vendor'
  | 'expenseCategory'
  | 'submittedAt'
  | 'department'
  | 'relatedProject'
  | 'invoiceTags'
  | 'documents'
  | 'paymentType'
  | 'invoiceDate'

export type ExpenseColumnMeta = {
  columnKey: ExpenseTableColumnId
  label?: string
  enabled: boolean
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
}

export type StatusColorConfig = {
  statusName: string
  textColor: string
  backgroundColor: string
}

export type PaymentTypeColorConfig = {
  paymentTypeName: string
  textColor: string
  backgroundColor: string
}

export type ExpenseTableConfig = {
  columns: ExpenseTableColumnId[]
  columnMeta?: ExpenseColumnMeta[]
  pageSize: number
  defaultSortColumn: 'created_at' | 'title' | 'amount'
  defaultSortDirection: 'asc' | 'desc'
  statusColors: StatusColorConfig[]
  paymentTypeColors: PaymentTypeColorConfig[]
  sortableColumns: ExpenseTableColumnId[]
  readOnly?: boolean
}

export type ActiveFilters = {
  q: string
  statusId?: string
  categoryIds: string[]
  projectIds: string[]
  departmentValues: string[]
  tagIds: string[]
  amountMin: string
  amountMax: string
  dateFrom: string | null
  dateTo: string | null
}

export const EMPTY_ACTIVE_FILTERS: ActiveFilters = {
  q: '',
  categoryIds: [],
  projectIds: [],
  departmentValues: [],
  tagIds: [],
  amountMin: '',
  amountMax: '',
  dateFrom: null,
  dateTo: null,
}

export type ExpenseTagEntry = { id: string; label: string }

export type ExpenseRow = {
  id: string
  title: string
  status: string
  statusId: string | null
  statusColor: string | null
  amount: number | null
  vendor: string
  vendorId: string | null
  expenseCategory: string
  expenseCategoryId: string | null
  department: string
  departmentValue: string | null
  relatedProject: string
  relatedProjectIds: string[]
  invoiceTags: ExpenseTagEntry[]
  invoiceTagsDisplay: string
  paymentType: string
  invoiceDate: string
  submittedAt: string
  documents: ExpenseDocument[]
  raw: ExpenseRecord
}

export type ExpenseAdminTableProps = {
  companyId: string
  config: ExpenseTableConfig
  rows: ExpenseRow[]
  statuses: ExpenseStatus[]
  sortColumn: 'created_at' | 'title' | 'amount'
  sortDirection: 'asc' | 'desc'
  onSortChange: (
    column: 'created_at' | 'title' | 'amount',
    direction: 'asc' | 'desc',
  ) => void
  readOnly?: boolean
}
