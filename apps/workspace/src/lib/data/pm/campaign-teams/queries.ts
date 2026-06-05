import { DEFAULT_LIST_STALE_TIME } from '@/lib/data/_shared/query-policy'

import { campaignTeamKeys } from './keys'
import { getCampaignTeams } from './server'
import type { PmCampaignTeamWithMembers } from './types'

export function pmCampaignTeamsListQuery(campaignId: string) {
  return {
    queryKey: campaignTeamKeys.list(campaignId),
    queryFn: () => getCampaignTeams({ data: { campaignId } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof campaignTeamKeys.list>
    queryFn: () => Promise<PmCampaignTeamWithMembers[]>
    staleTime: number
  }
}
