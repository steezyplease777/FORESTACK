// @ts-nocheck
import {
  DEFAULT_LIST_STALE_TIME,
  DEFAULT_REFERENCE_STALE_TIME,
} from '@/lib/data/_shared/query-policy'
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import { expenseKeys } from './keys'
import {
  getExpenseCategories,
  getExpenseDepartmentOptions,
  getExpenseDocumentTypes,
  getExpenseProjectOptions,
  getExpenseStatuses,
  getExpenseTags,
  getExpenses,
} from './server'
import type {
  ExpenseDocumentType,
  ExpenseListParams,
  ExpenseRecord,
  ExpenseStatus,
} from './types'

export type UseExpensesOptions = Omit<ExpenseListParams, 'companyId'>

export function erpExpensesListQuery(
  companyId: string,
  options: UseExpensesOptions = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''
  const statusId = options.statusId
  const sortColumn = options.sortColumn ?? 'created_at'
  const sortDirection = options.sortDirection ?? 'desc'

  const params = {
    page,
    pageSize,
    q,
    statusId,
    categoryIds: options.categoryIds,
    projectIds: options.projectIds,
    departmentValues: options.departmentValues,
    tagIds: options.tagIds,
    amountMin: options.amountMin,
    amountMax: options.amountMax,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
    sortColumn,
    sortDirection,
  }

  return {
    queryKey: expenseKeys.list(companyId, params),
    queryFn: () => getExpenses({ data: { companyId, ...params } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof expenseKeys.list>
    queryFn: () => Promise<PaginatedResult<ExpenseRecord>>
    staleTime: number
  }
}

export function erpExpenseStatusesQuery(companyId: string) {
  return {
    queryKey: expenseKeys.statuses(companyId),
    queryFn: () => getExpenseStatuses({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof expenseKeys.statuses>
    queryFn: () => Promise<ExpenseStatus[]>
    staleTime: number
  }
}

export function erpExpenseCategoriesQuery(companyId: string) {
  return {
    queryKey: expenseKeys.categories(companyId),
    queryFn: () => getExpenseCategories({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  }
}

export function erpExpenseTagsQuery(companyId: string) {
  return {
    queryKey: expenseKeys.tags(companyId),
    queryFn: () => getExpenseTags({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  }
}

export function erpExpenseProjectsQuery(companyId: string) {
  return {
    queryKey: expenseKeys.projects(companyId),
    queryFn: () => getExpenseProjectOptions({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  }
}

export function erpExpenseDepartmentsQuery(companyId: string) {
  return {
    queryKey: expenseKeys.departments(companyId),
    queryFn: () => getExpenseDepartmentOptions({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  }
}

export function erpExpenseDocumentTypesQuery(companyId: string) {
  return {
    queryKey: expenseKeys.documentTypes(companyId),
    queryFn: () => getExpenseDocumentTypes({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof expenseKeys.documentTypes>
    queryFn: () => Promise<ExpenseDocumentType[]>
    staleTime: number
  }
}
