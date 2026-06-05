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

import { uploadExpenseDocumentFile } from './document-storage'
import { expenseKeys } from './keys'
import { invalidateErpExpenses } from './mutations'
import {
  erpExpenseCategoriesQuery,
  erpExpenseDepartmentsQuery,
  erpExpenseDocumentTypesQuery,
  erpExpenseProjectsQuery,
  erpExpenseStatusesQuery,
  erpExpenseTagsQuery,
  erpExpensesListQuery,
  type UseExpensesOptions,
} from './queries'
import {
  bulkUpdateExpensesFn,
  signExpenseDocumentUrls,
  updateExpenseFn,
  uploadExpenseDocument,
} from './server'
import type {
  CreateExpenseDocumentInput,
  ExpenseDocument,
  ExpenseDocumentSignedUrl,
  ExpenseDocumentType,
  ExpenseRecord,
  ExpenseStatus,
  ExpenseUpdatePatch,
} from './types'

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
    options.categoryIds,
    options.projectIds,
    options.departmentValues,
    options.tagIds,
    options.amountMin,
    options.amountMax,
    options.dateFrom,
    options.dateTo,
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

export function useExpenseCategories(companyId: string) {
  return useQuery({
    ...erpExpenseCategoriesQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useExpenseTags(companyId: string) {
  return useQuery({
    ...erpExpenseTagsQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useExpenseProjectOptions(companyId: string) {
  return useQuery({
    ...erpExpenseProjectsQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useExpenseDepartmentOptions(companyId: string) {
  return useQuery({
    ...erpExpenseDepartmentsQuery(companyId),
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

export function useBulkExpenseUpdate(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { ids: string[]; patch: ExpenseUpdatePatch }) =>
      bulkUpdateExpensesFn({ data: input }),
    onSuccess: () => invalidateErpExpenses(qc, companyId),
  })
}

export function useExpenseDocumentTypes(companyId: string) {
  return useQuery<ExpenseDocumentType[]>({
    ...erpExpenseDocumentTypesQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

type SignDocumentItem = {
  document: ExpenseDocument
  expenseId: string
}

export function useExpenseDocumentSignedUrls(
  companyId: string,
  items: SignDocumentItem[],
) {
  const documentIds = React.useMemo(
    () => items.map((item) => item.document.id).filter(Boolean),
    [items],
  )

  return useQuery<ExpenseDocumentSignedUrl[]>({
    queryKey: expenseKeys.signedUrls(companyId, documentIds),
    queryFn: () =>
      signExpenseDocumentUrls({
        data: { companyId, items },
      }),
    enabled: !!companyId && items.length > 0,
    staleTime: 50 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useUploadExpenseDocument(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Omit<CreateExpenseDocumentInput, 'filePath' | 'mimeType'> & {
        file: File
      },
    ) => {
      const filePath = await uploadExpenseDocumentFile(input.file)
      return uploadExpenseDocument({
        data: {
          expenseId: input.expenseId,
          companyId: input.companyId,
          name: input.name,
          typeId: input.typeId,
          filePath,
          mimeType: input.file.type || 'application/octet-stream',
        },
      })
    },
    onSuccess: () => invalidateErpExpenses(qc, companyId),
  })
}

export type { ExpenseRecord, ExpenseStatus, ExpenseUpdatePatch } from './types'
