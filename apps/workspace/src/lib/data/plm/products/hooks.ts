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
  invalidatePlmProductDetail,
  invalidatePlmProducts,
} from './mutations'
import {
  plmProductDetailQuery,
  plmProductSearchQuery,
  plmProductsListQuery,
  type UsePlmProductsOptions,
} from './queries'
import {
  createProductFn,
  deleteProductFn,
  updateProductFn,
} from './server'
import type { PlmProduct, ProductDetail, ProductListRow } from './types'

export type { UsePlmProductsOptions } from './queries'

/**
 * Paginated + searchable product list. Mirrors `useCampaigns`:
 * - `{ page, pageSize, q }` cached independently.
 * - `keepPreviousData` avoids flicker on page change / typing.
 * - Prefetches the next page so clicking Next feels instant.
 */
export function usePlmProducts(
  companyId: string,
  options: UsePlmProductsOptions = {},
) {
  const qc = useQueryClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  const query = useQuery<PaginatedResult<ProductListRow>>({
    ...plmProductsListQuery(companyId, options),
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
      ...plmProductsListQuery(companyId, { page: nextPage, pageSize, q }),
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

export function usePlmProductDetail(companyId: string, productId: string) {
  return useQuery<ProductDetail>({
    ...plmProductDetailQuery(companyId, productId),
    enabled: !!companyId && !!productId,
  })
}

export function usePlmProductSearch(companyId: string, query: string) {
  return useQuery<ProductListRow[]>({
    ...plmProductSearchQuery(companyId, query),
    enabled: !!companyId && query.trim().length >= 2,
    placeholderData: keepPreviousData,
  })
}

export function useCreatePlmProduct(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<
        PlmProduct,
        'company_id' | 'name' | 'style_id' | 'colorway_id' | 'campaign_id'
      > &
        Partial<
          Pick<
            PlmProduct,
            | 'sourcing_id'
            | 'internal_product_code'
            | 'msrp'
            | 'retail_description'
            | 'seo_description'
          >
        >,
    ) => createProductFn({ data: input }),
    onSuccess: () => invalidatePlmProducts(qc, companyId, companySlug),
  })
}

export function useUpdatePlmProduct(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: Partial<Omit<PlmProduct, 'id' | 'company_id' | 'created_at'>> & {
      id: string
    }) => updateProductFn({ data: { id, patch } }),
    onSuccess: (_, vars) =>
      invalidatePlmProductDetail(qc, companyId, vars.id, companySlug),
  })
}

export function useDeletePlmProduct(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteProductFn({ data: { id } }),
    onSuccess: () => invalidatePlmProducts(qc, companyId, companySlug),
  })
}

export type {
  PlmProduct,
  PlmProductVariant,
  PlmStyle,
  ProductDetail,
  ProductListRow,
  ProductWithVariants,
} from './types'
