import type {
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

export type ExpenseTableConfig = {
  columns: ExpenseTableColumnId[]
  pageSize: number
  defaultSortColumn: 'created_at' | 'title' | 'amount'
  defaultSortDirection: 'asc' | 'desc'
  statusColors: Record<string, string>
}

export type ActiveFilters = {
  q: string
  statusId?: string
}

export type ExpenseRow = {
  id: string
  title: string
  status: string
  statusId: string | null
  statusColor: string | null
  amount: number | null
  vendor: string
  expenseCategory: string
  department: string
  relatedProject: string
  submittedAt: string
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
