export type PmCampaignCategory = {
  id: string
  company_id: string
  name: string
  description: string | null
  created_at: string
}

export type PmCampaign = {
  id: string
  company_id: string
  category_id: string
  name: string
  campaign_code: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  campaign_image_url: string | null
  created_at: string
}

export type PmCampaignWithCategory = PmCampaign & {
  category: PmCampaignCategory | null
}

export type PmCampaignColorway = {
  id: string
  campaign_id: string
  company_id: string
  name: string
  colorway_code: string | null
  created_at: string
}

export type PmCampaignDetail = PmCampaignWithCategory & {
  colorways: PmCampaignColorway[]
}
