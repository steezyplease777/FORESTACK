import {
  DEFAULT_LIST_STALE_TIME,
  DEFAULT_REFERENCE_STALE_TIME,
} from '@/lib/data/_shared/query-policy'
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import { campaignKeys } from './keys'
import {
  getCampaign,
  getCampaignCategories,
  getCampaigns,
} from './server'
import type {
  PmCampaignCategory,
  PmCampaignDetail,
  PmCampaignWithCategory,
} from './types'

export type UseCampaignsOptions = {
  page?: number
  pageSize?: number
  q?: string
}

export function pmCampaignsListQuery(
  companyId: string,
  options: UseCampaignsOptions = {},
) {
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  return {
    queryKey: campaignKeys.list(companyId, { page, pageSize, q }),
    queryFn: () => getCampaigns({ data: { companyId, page, pageSize, q } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof campaignKeys.list>
    queryFn: () => Promise<PaginatedResult<PmCampaignWithCategory>>
    staleTime: number
  }
}

export function pmCampaignDetailQuery(companyId: string, campaignId: string) {
  return {
    queryKey: campaignKeys.detail(companyId, campaignId),
    queryFn: () => getCampaign({ data: { companyId, campaignId } }),
  } satisfies {
    queryKey: ReturnType<typeof campaignKeys.detail>
    queryFn: () => Promise<PmCampaignDetail>
  }
}

export function pmCampaignCategoriesQuery(companyId: string) {
  return {
    queryKey: campaignKeys.categories(companyId),
    queryFn: () => getCampaignCategories({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof campaignKeys.categories>
    queryFn: () => Promise<PmCampaignCategory[]>
    staleTime: number
  }
}
