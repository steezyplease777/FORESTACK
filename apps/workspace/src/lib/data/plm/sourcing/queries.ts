import { DEFAULT_LIST_STALE_TIME } from '@/lib/data/_shared/query-policy'
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import { plmSourcingKeys } from './keys'
import {
  getSourcing,
  getSourcingByStyle,
  getSourcingDetail,
} from './server'
import type { SourcingWithRefs } from './types'

export type UsePlmSourcingOptions = {
  page?: number
  pageSize?: number
  q?: string
}

export function plmSourcingListQuery(
  companyId: string,
  options: UsePlmSourcingOptions = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  return {
    queryKey: plmSourcingKeys.list(companyId, { page, pageSize, q }),
    queryFn: () => getSourcing({ data: { companyId, page, pageSize, q } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof plmSourcingKeys.list>
    queryFn: () => Promise<PaginatedResult<SourcingWithRefs>>
    staleTime: number
  }
}

export function plmSourcingDetailQuery(companyId: string, sourcingId: string) {
  return {
    queryKey: plmSourcingKeys.detail(companyId, sourcingId),
    queryFn: () => getSourcingDetail({ data: { companyId, sourcingId } }),
  } satisfies {
    queryKey: ReturnType<typeof plmSourcingKeys.detail>
    queryFn: () => Promise<SourcingWithRefs>
  }
}

export function plmSourcingByStyleQuery(
  companyId: string,
  styleId: string,
) {
  return {
    queryKey: plmSourcingKeys.byStyle(companyId, styleId),
    queryFn: () => getSourcingByStyle({ data: { companyId, styleId } }),
  } satisfies {
    queryKey: ReturnType<typeof plmSourcingKeys.byStyle>
    queryFn: () => Promise<SourcingWithRefs[]>
  }
}
