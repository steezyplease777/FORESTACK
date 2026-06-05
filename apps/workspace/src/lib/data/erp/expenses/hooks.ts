// @ts-nocheck
import * as React from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
  totalPages,
} from '@/lib/data/_shared/pagination'

import { invalidateErpExpenses } from './mutations'
import {
  erpExpenseStatusesQuery,
  erpExpensesListQuery,
  type UseExpensesOptions,
} from './queries'
import { updateExpenseFn } from './server'
import type { ExpenseRecord, ExpenseStatus, ExpenseUpdatePatch } from './types'

export type { UseExpensesOptions } from './queries'

export function useExpenses(companyId: string, options: UseExpensesOptions = {}) {
  const qc = useQueryClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  const query = useQuery<PaginatedResult<ExpenseRecord>>({
    ...erpExpensesListQuery(companyId, options),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })

  const totalCount = query.data?.total ?? 0
  const pageCount = totalPages(totalCount, pageSize)

  React.useEffect(() => {
    if (!companyId) return
    if (query.isLoading || query.isPlaceholderData) return
    const nextPage = page + 1
    if (nextPage > pageCount) return
    qc.prefetchQuery({
      ...erpExpensesListQuery(companyId, { ...options, page: nextPage }),
    })
  }, [
    companyId,
    page,
    pageSize,
    q,
    options.statusId,
    options.sortColumn,
    options.sortDirection,
    pageCount,
    query.isLoading,
    query.isPlaceholderData,
    qc,
  ])

  return query
}

export function useExpenseStatuses(companyId: string) {
  return useQuery<ExpenseStatus[]>({
    ...erpExpenseStatusesQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useExpenseUpdate(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; patch: ExpenseUpdatePatch }) =>
      updateExpenseFn({ data: input }),
    onSuccess: () => invalidateErpExpenses(qc, companyId),
  })
}

export type { ExpenseRecord, ExpenseStatus, ExpenseUpdatePatch } from './types'
