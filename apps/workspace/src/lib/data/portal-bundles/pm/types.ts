import type { PortalBundle } from '../shared'

/**
 * Minimal category shape returned inside the PM bundle. The full
 * category row (description, created_at, etc.) is exposed as
 * `PmBundleCategory` for forms that need to list existing categories.
 */
export type PmBundleCategoryRef = {
  id: string
  name: string
}

export type PmBundleCategory = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export type PmBundleCampaign = {
  id: string
  name: string
  campaign_code: string | null
  description: string | null
  start_date: string | null
  end_date: string | null
  campaign_image_url: string | null
  created_at: string
  category_id: string
  category: PmBundleCategoryRef | null
}

export type PmBundleMetrics = {
  campaignCount: number
  projectCount: number
  categoryCount: number
  colorwayCount: number
  projectTaskCount: number
  openTaskCount: number
}

export type PmBundle = PortalBundle & {
  metrics: PmBundleMetrics
  categories: PmBundleCategory[]
  recentCampaigns: PmBundleCampaign[]
}
