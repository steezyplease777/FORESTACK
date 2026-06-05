import type { QueryClient } from '@tanstack/react-query'

import { invalidatePmPortalBundle } from '@/lib/data/pm/_shared/invalidate'

import { campaignKeys } from './keys'

export function invalidatePmCampaigns(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: campaignKeys.lists(companyId) })
  invalidatePmPortalBundle(queryClient, companySlug)
}

export function invalidatePmCampaignDetail(
  queryClient: QueryClient,
  companyId: string,
  campaignId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: campaignKeys.lists(companyId) })
  queryClient.invalidateQueries({
    queryKey: campaignKeys.detail(companyId, campaignId),
  })
  invalidatePmPortalBundle(queryClient, companySlug)
}

export function invalidatePmCampaignCategories(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({
    queryKey: campaignKeys.categories(companyId),
  })
  invalidatePmPortalBundle(queryClient, companySlug)
}

export function invalidatePmCampaignCategoriesAndLists(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({
    queryKey: campaignKeys.categories(companyId),
  })
  queryClient.invalidateQueries({ queryKey: campaignKeys.lists(companyId) })
  invalidatePmPortalBundle(queryClient, companySlug)
}
