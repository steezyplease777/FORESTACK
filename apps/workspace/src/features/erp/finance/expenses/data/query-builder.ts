import type { ActiveFilters } from '../ExpenseAdminTable.types'
import {
  sortColumnForTableColumn,
  type ExpenseSortColumn,
} from './field-map'

export type ExpenseQueryParams = {
  q?: string
  statusIds?: string[]
  categoryIds?: string[]
  projectIds?: string[]
  departmentValues?: string[]
  tagIds?: string[]
  amountMin?: number
  amountMax?: number
  dateFrom?: string
  dateTo?: string
  sortColumn?: ExpenseSortColumn
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
    statusIds:
      filters.statusIds.length > 0 ? filters.statusIds : undefined,
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
  if (filters.statusIds.length) count += 1
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
): ExpenseSortColumn | undefined {
  return sortColumnForTableColumn(columnId)
}
