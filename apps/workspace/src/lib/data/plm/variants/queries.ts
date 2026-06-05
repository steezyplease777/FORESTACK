import { DEFAULT_LIST_STALE_TIME } from '@/lib/data/_shared/query-policy'
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import { plmVariantKeys } from './keys'
import { getVariants } from './server'
import type { VariantWithRefs } from './types'

export type UsePlmVariantsOptions = {
  page?: number
  pageSize?: number
  q?: string
}

export function plmVariantsListQuery(
  companyId: string,
  options: UsePlmVariantsOptions = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  return {
    queryKey: plmVariantKeys.list(companyId, { page, pageSize, q }),
    queryFn: () => getVariants({ data: { companyId, page, pageSize, q } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof plmVariantKeys.list>
    queryFn: () => Promise<PaginatedResult<VariantWithRefs>>
    staleTime: number
  }
}
