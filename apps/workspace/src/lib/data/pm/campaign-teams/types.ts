/**
 * Campaign-level teams. A campaign can have multiple named teams
 * (e.g. "Design", "Marketing"), each with its own member roster drawn
 * from `app_company_users`. Used by the Team card on the campaign
 * detail page and the Team tab of the settings modal.
 */
export type PmCampaignTeam = {
  id: string
  campaign_id: string
  company_id: string
  name: string
  created_at: string
}

export type PmCampaignTeamMember = {
  id: string
  campaign_team_id: string
  company_user_id: string
  description: string | null
  created_at: string
  firstName: string | null
  lastName: string | null
  email: string | null
  profilePictureUrl: string | null
}

export type PmCampaignTeamWithMembers = PmCampaignTeam & {
  members: PmCampaignTeamMember[]
}
