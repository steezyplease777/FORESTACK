import type { QueryClient } from '@tanstack/react-query'

import { campaignKeys } from '@/lib/data/pm/campaigns/keys'
import { invalidatePmPortalBundle } from '@/lib/data/pm/_shared/invalidate'

import { campaignTeamKeys } from './keys'

export function invalidatePmCampaignTeams(
  queryClient: QueryClient,
  campaignId: string,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: campaignTeamKeys.list(campaignId) })
  queryClient.invalidateQueries({
    queryKey: campaignKeys.detail(companyId, campaignId),
  })
  invalidatePmPortalBundle(queryClient, companySlug)
}
