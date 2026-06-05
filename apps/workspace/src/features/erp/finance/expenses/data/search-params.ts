import type { ActiveFilters } from '../ExpenseAdminTable.types'

export function parseCsvParam(value: string | undefined): string[] {
  if (!value?.trim()) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

export function serializeCsvParam(values: string[]): string | undefined {
  return values.length > 0 ? values.join(',') : undefined
}

export function filtersFromSearch(search: {
  q?: string
  statusId?: string
  categoryIds?: string
  projectIds?: string
  departmentValues?: string
  tagIds?: string
  amountMin?: string
  amountMax?: string
  dateFrom?: string
  dateTo?: string
}): ActiveFilters {
  return {
    q: search.q ?? '',
    statusId: search.statusId,
    categoryIds: parseCsvParam(search.categoryIds),
    projectIds: parseCsvParam(search.projectIds),
    departmentValues: parseCsvParam(search.departmentValues),
    tagIds: parseCsvParam(search.tagIds),
    amountMin: search.amountMin ?? '',
    amountMax: search.amountMax ?? '',
    dateFrom: search.dateFrom ?? null,
    dateTo: search.dateTo ?? null,
  }
}

export function filtersToSearchPatch(
  filters: ActiveFilters,
): Record<string, string | undefined> {
  return {
    q: filters.q || undefined,
    statusId: filters.statusId,
    categoryIds: serializeCsvParam(filters.categoryIds),
    projectIds: serializeCsvParam(filters.projectIds),
    departmentValues: serializeCsvParam(filters.departmentValues),
    tagIds: serializeCsvParam(filters.tagIds),
    amountMin: filters.amountMin.trim() || undefined,
    amountMax: filters.amountMax.trim() || undefined,
    dateFrom: filters.dateFrom ?? undefined,
    dateTo: filters.dateTo ?? undefined,
  }
}
