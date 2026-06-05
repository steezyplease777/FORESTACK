import { DEFAULT_LIST_STALE_TIME } from '@/lib/data/_shared/query-policy'
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import { plmProductKeys } from './keys'
import {
  getProductDetail,
  getProducts,
  searchProductsServer,
} from './server'
import type { ProductDetail, ProductListRow } from './types'

export type UsePlmProductsOptions = {
  page?: number
  pageSize?: number
  q?: string
}

export function plmProductsListQuery(
  companyId: string,
  options: UsePlmProductsOptions = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  return {
    queryKey: plmProductKeys.list(companyId, { page, pageSize, q }),
    queryFn: () => getProducts({ data: { companyId, page, pageSize, q } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof plmProductKeys.list>
    queryFn: () => Promise<PaginatedResult<ProductListRow>>
    staleTime: number
  }
}

export function plmProductDetailQuery(companyId: string, productId: string) {
  return {
    queryKey: plmProductKeys.detail(companyId, productId),
    queryFn: () => getProductDetail({ data: { companyId, productId } }),
  } satisfies {
    queryKey: ReturnType<typeof plmProductKeys.detail>
    queryFn: () => Promise<ProductDetail>
  }
}

export function plmProductSearchQuery(companyId: string, query: string) {
  return {
    queryKey: plmProductKeys.search(companyId, query),
    queryFn: () => searchProductsServer({ data: { companyId, query } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof plmProductKeys.search>
    queryFn: () => Promise<ProductListRow[]>
    staleTime: number
  }
}
