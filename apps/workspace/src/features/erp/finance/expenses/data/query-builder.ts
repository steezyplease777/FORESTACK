import type { ActiveFilters } from '../ExpenseAdminTable.types'
import { EXPENSE_FIELD_MAP } from './field-map'

export type ExpenseQueryParams = {
  q?: string
  statusId?: string
  categoryIds?: string[]
  projectIds?: string[]
  departmentValues?: string[]
  tagIds?: string[]
  amountMin?: number
  amountMax?: number
  dateFrom?: string
  dateTo?: string
  sortColumn?: 'created_at' | 'title' | 'amount'
  sortDirection?: 'asc' | 'desc'
}

function parseAmountBound(raw: string): number | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const n = parseFloat(trimmed)
  return Number.isFinite(n) ? n : undefined
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
    categoryIds:
      filters.categoryIds.length > 0 ? filters.categoryIds : undefined,
    projectIds:
      filters.projectIds.length > 0 ? filters.projectIds : undefined,
    departmentValues:
      filters.departmentValues.length > 0
        ? filters.departmentValues
        : undefined,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    amountMin: parseAmountBound(filters.amountMin),
    amountMax: parseAmountBound(filters.amountMax),
    dateFrom: filters.dateFrom ?? undefined,
    dateTo: filters.dateTo ?? undefined,
    sortColumn,
    sortDirection,
  }
}

export function countStructuredFilters(filters: ActiveFilters): number {
  let count = 0
  if (filters.categoryIds.length) count += 1
  if (filters.projectIds.length) count += 1
  if (filters.departmentValues.length) count += 1
  if (filters.tagIds.length) count += 1
  if (filters.amountMin.trim()) count += 1
  if (filters.amountMax.trim()) count += 1
  if (filters.dateFrom) count += 1
  if (filters.dateTo) count += 1
  return count
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
