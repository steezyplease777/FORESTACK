import * as React from 'react'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
  totalPages,
} from '@/lib/data/_shared/pagination'

import { plmVariantsListQuery, type UsePlmVariantsOptions } from './queries'
import type { VariantWithRefs } from './types'

export type { UsePlmVariantsOptions } from './queries'

export function usePlmVariants(
  companyId: string,
  options: UsePlmVariantsOptions = {},
) {
  const qc = useQueryClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  const query = useQuery<PaginatedResult<VariantWithRefs>>({
    ...plmVariantsListQuery(companyId, options),
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
      ...plmVariantsListQuery(companyId, { page: nextPage, pageSize, q }),
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

export type { VariantWithRefs, PlmProductVariant } from './types'
