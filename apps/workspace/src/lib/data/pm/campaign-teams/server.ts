import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type {
  PmCampaignTeam,
  PmCampaignTeamMember,
  PmCampaignTeamWithMembers,
} from './types'

/**
 * Teams for a campaign with their members inlined. One network hop,
 * shape is denormalized to match what the Team card + Team settings
 * tab render directly.
 */
export const getCampaignTeams = createServerFn({ method: 'GET' })
  .inputValidator((data: { campaignId: string }) => data)
  .handler(async ({ data }): Promise<PmCampaignTeamWithMembers[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('pm_campaign_teams')
      .select(
        `id, campaign_id, company_id, name, created_at,
         members:pm_campaign_team_members (
           id, campaign_team_id, company_user_id, description, created_at,
           company_user:company_user_id (
             id,
             org_user:org_user_id (first_name, last_name, email, profile_picture_url)
           )
         )`,
      )
      .eq('campaign_id', data.campaignId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)

    return (rows ?? []).map((team) => ({
      id: team.id,
      campaign_id: team.campaign_id,
      company_id: team.company_id,
      name: team.name,
      created_at: team.created_at,
      members: (team.members ?? []).map((m: any) => {
        const cu = Array.isArray(m.company_user) ? m.company_user[0] : m.company_user
        const ou = cu && (Array.isArray(cu.org_user) ? cu.org_user[0] : cu.org_user)
        return {
          id: m.id,
          campaign_team_id: m.campaign_team_id,
          company_user_id: m.company_user_id,
          description: m.description ?? null,
          created_at: m.created_at,
          firstName: ou?.first_name ?? null,
          lastName: ou?.last_name ?? null,
          email: ou?.email ?? null,
          profilePictureUrl: ou?.profile_picture_url ?? null,
        } as PmCampaignTeamMember
      }),
    })) as PmCampaignTeamWithMembers[]
  })

export const createCampaignTeamFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { campaign_id: string; company_id: string; name: string }) => data,
  )
  .handler(async ({ data }): Promise<PmCampaignTeam> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_campaign_teams')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmCampaignTeam
  })

export const renameCampaignTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string; name: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaign_teams')
      .update({ name: data.name })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteCampaignTeamFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaign_teams')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const addCampaignTeamMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      campaign_team_id: string
      company_user_id: string
      description?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaign_team_members')
      .insert({
        campaign_team_id: data.campaign_team_id,
        company_user_id: data.company_user_id,
        description: data.description ?? null,
      })
    if (error) throw new Error(error.message)
  })

export const removeCampaignTeamMemberFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaign_team_members')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })
