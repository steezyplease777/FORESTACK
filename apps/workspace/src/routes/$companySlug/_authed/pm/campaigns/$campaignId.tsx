import { createFileRoute } from '@tanstack/react-router'

import { PmCampaignDetailPage } from '@/features/company/pages/pm/pm-campaign-detail-page'
import { pmCampaignTeamsListQuery } from '@/lib/data/pm/campaign-teams/queries'
import {
  pmCampaignCategoriesQuery,
  pmCampaignDetailQuery,
} from '@/lib/data/pm/campaigns/queries'
import {
  pmProjectsListQuery,
  pmProjectTypesQuery,
} from '@/lib/data/pm/projects/queries'
import { companyTeamQuery } from '@/lib/data/team/hooks'

export const Route = createFileRoute(
  '/$companySlug/_authed/pm/campaigns/$campaignId',
)({
  loader: ({ context, params }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    return Promise.all([
      qc.ensureQueryData(
        pmCampaignDetailQuery(companyId, params.campaignId),
      ),
      qc.ensureQueryData(pmCampaignCategoriesQuery(companyId)),
      // Pre-seed the projects section so it renders with content on
      // first paint rather than flashing a loading state. Same
      // scope/page/pageSize/q shape the Projects card uses on the page.
      qc.ensureQueryData(
        pmProjectsListQuery(companyId, {
          scope: { campaignId: params.campaignId },
          page: 1,
          pageSize: 10,
        }),
      ),
      // Types for the "New project" modal launched from this page.
      qc.ensureQueryData(pmProjectTypesQuery(companyId)),
      // Campaign teams — rendered by the Team card on this page AND
      // by the Team tab of the settings modal. Prefetching here makes
      // both land with data on first paint.
      qc.ensureQueryData(
        pmCampaignTeamsListQuery(params.campaignId),
      ),
      // Company user roster — used by the Team tab's "add member"
      // picker. Lazy-fetching this when the tab first opens is what
      // made the modal feel slow; prefetching up front fixes it.
      qc.ensureQueryData(companyTeamQuery(companyId)),
    ])
  },
  component: PmCampaignDetailPage,
})
