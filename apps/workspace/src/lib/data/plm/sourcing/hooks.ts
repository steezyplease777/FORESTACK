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

import {
  invalidatePlmSourcing,
  invalidatePlmSourcingDetail,
} from './mutations'
import {
  plmSourcingByStyleQuery,
  plmSourcingDetailQuery,
  plmSourcingListQuery,
  type UsePlmSourcingOptions,
} from './queries'
import {
  createSourcingFn,
  deleteSourcingFn,
  updateSourcingFn,
} from './server'
import type { PlmStyleSourcing, SourcingWithRefs } from './types'

export type { UsePlmSourcingOptions } from './queries'

export function usePlmSourcing(
  companyId: string,
  options: UsePlmSourcingOptions = {},
) {
  const qc = useQueryClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  const query = useQuery<PaginatedResult<SourcingWithRefs>>({
    ...plmSourcingListQuery(companyId, options),
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
      ...plmSourcingListQuery(companyId, { page: nextPage, pageSize, q }),
    })
  }, [
    companyId,
    page,
    pageSize,
    q,
    pageCount,
    query.isLoading,
    query.isPlaceholderData,
    qc,
  ])

  return query
}

export function usePlmSourcingDetail(
  companyId: string,
  sourcingId: string,
) {
  return useQuery<SourcingWithRefs>({
    ...plmSourcingDetailQuery(companyId, sourcingId),
    enabled: !!companyId && !!sourcingId,
  })
}

export function usePlmSourcingByStyle(
  companyId: string,
  styleId: string | null | undefined,
) {
  const resolvedStyleId = styleId ?? ''
  return useQuery<SourcingWithRefs[]>({
    ...plmSourcingByStyleQuery(companyId, resolvedStyleId),
    enabled: !!companyId && !!styleId,
  })
}

export function useCreatePlmSourcing(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PlmStyleSourcing, 'company_id' | 'style_id' | 'vendor_id'> &
        Partial<Pick<PlmStyleSourcing, 'cog' | 'hs_tariff_code' | 'weight'>>,
    ) => createSourcingFn({ data: input }),
    onSuccess: () => invalidatePlmSourcing(qc, companyId, companySlug),
  })
}

export function useUpdatePlmSourcing(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: Partial<
      Omit<PlmStyleSourcing, 'id' | 'company_id' | 'created_at'>
    > & { id: string }) => updateSourcingFn({ data: { id, patch } }),
    onSuccess: (_, vars) =>
      invalidatePlmSourcingDetail(qc, companyId, vars.id, companySlug),
  })
}

export function useDeletePlmSourcing(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteSourcingFn({ data: { id } }),
    onSuccess: () => invalidatePlmSourcing(qc, companyId, companySlug),
  })
}

export type { PlmStyleSourcing, SourcingWithRefs } from './types'
