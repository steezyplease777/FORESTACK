export type PmProjectType = {
  id: string
  company_id: string
  name: string
  description: string | null
  created_at: string
}

/**
 * Matches `public.pm_projects`. `campaign_id` is nullable post-migration
 * `pm_projects_allow_standalone`:
 *   - Campaign-scoped project → `campaign_id` set, auto-filled by the
 *     campaign detail page's "New project" button.
 *   - Standalone project → `campaign_id` null, created from the
 *     Projects tab with no campaign association.
 */
export type PmProject = {
  id: string
  campaign_id: string | null
  company_id: string
  type_id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  status: string | null
  created_at: string
}

/** Pared-down campaign shape embedded in list + detail responses. */
export type PmProjectCampaignRef = {
  id: string
  name: string
  campaign_code: string | null
}

/** Lightweight task shape embedded in list responses so the
 *  status-forward projects list can render progress/bucket counts
 *  without a second round-trip. */
export type PmProjectTaskRollupItem = {
  id: string
  status: string | null
}

export type PmProjectWithRefs = PmProject & {
  campaign: PmProjectCampaignRef | null
  type: PmProjectType | null
  /** Set on list responses; undefined on single-project fetches. */
  tasks?: PmProjectTaskRollupItem[]
  /** Set on list responses; undefined on single-project fetches. */
  member_count?: number
}

export type PmProjectDetail = PmProjectWithRefs
