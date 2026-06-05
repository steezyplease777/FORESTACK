import type { ExpenseTableConfig } from '../ExpenseAdminTable.types'

export const DEFAULT_EXPENSE_TABLE_CONFIG: ExpenseTableConfig = {
  columns: [
    'title',
    'status',
    'amount',
    'vendor',
    'expenseCategory',
    'submittedAt',
  ],
  pageSize: 50,
  defaultSortColumn: 'created_at',
  defaultSortDirection: 'desc',
  statusColors: {},
}
