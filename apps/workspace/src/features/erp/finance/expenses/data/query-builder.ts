import type { ActiveFilters } from '../ExpenseAdminTable.types'
import { EXPENSE_FIELD_MAP } from './field-map'

export type ExpenseQueryParams = {
  q?: string
  statusId?: string
  sortColumn?: 'created_at' | 'title' | 'amount'
  sortDirection?: 'asc' | 'desc'
}

/** Map toolbar filter state to server query params. */
export function buildExpenseQueryParams(
  filters: ActiveFilters,
  sortColumn: ExpenseQueryParams['sortColumn'],
  sortDirection: ExpenseQueryParams['sortDirection'],
): ExpenseQueryParams {
  return {
    q: filters.q.trim() || undefined,
    statusId: filters.statusId,
    sortColumn,
    sortDirection,
  }
}

export function resolveSortColumn(
  columnId: string,
): ExpenseQueryParams['sortColumn'] {
  const meta = EXPENSE_FIELD_MAP[columnId]
  const col = meta?.sortColumn
  if (col === 'title' || col === 'amount' || col === 'created_at') return col
  if (columnId === 'submittedAt') return 'created_at'
  return 'created_at'
}
