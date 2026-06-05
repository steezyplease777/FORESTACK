import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidatePmCampaignTeams } from './mutations'
import { pmCampaignTeamsListQuery } from './queries'
import {
  addCampaignTeamMemberFn,
  createCampaignTeamFn,
  deleteCampaignTeamFn,
  removeCampaignTeamMemberFn,
  renameCampaignTeamFn,
} from './server'
import type { PmCampaignTeamWithMembers } from './types'

export function useCampaignTeams(campaignId: string) {
  return useQuery<PmCampaignTeamWithMembers[]>({
    ...pmCampaignTeamsListQuery(campaignId),
    enabled: !!campaignId,
  })
}

export function useCreateCampaignTeam(
  campaignId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) =>
      createCampaignTeamFn({
        data: { campaign_id: campaignId, company_id: companyId, name: input.name },
      }),
    onSuccess: () =>
      invalidatePmCampaignTeams(qc, campaignId, companyId, companySlug),
  })
}

export function useRenameCampaignTeam(
  campaignId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; name: string }) =>
      renameCampaignTeamFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignTeams(qc, campaignId, companyId, companySlug),
  })
}

export function useDeleteCampaignTeam(
  campaignId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) => deleteCampaignTeamFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignTeams(qc, campaignId, companyId, companySlug),
  })
}

export function useAddCampaignTeamMember(
  campaignId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      campaign_team_id: string
      company_user_id: string
      description?: string | null
    }) => addCampaignTeamMemberFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignTeams(qc, campaignId, companyId, companySlug),
  })
}

export function useRemoveCampaignTeamMember(
  campaignId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) =>
      removeCampaignTeamMemberFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignTeams(qc, campaignId, companyId, companySlug),
  })
}

export type {
  PmCampaignTeam,
  PmCampaignTeamMember,
  PmCampaignTeamWithMembers,
} from './types'
