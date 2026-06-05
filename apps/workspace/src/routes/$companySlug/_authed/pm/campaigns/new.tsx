import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PmCampaignNewPage } from '@/features/company/pages/pm/pm-campaign-new-page'
import { pmCampaignCategoriesQuery } from '@/lib/data/pm/campaigns/queries'

// `step` lives in the URL so the browser back button moves between
// wizard steps naturally and refreshing preserves position. Any
// invalid / missing value falls back to step 1 via `.catch()`.
const campaignNewSearch = z.object({
  step: z.coerce.number().int().min(1).max(3).catch(1),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/pm/campaigns/new',
)({
  validateSearch: campaignNewSearch,
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    // Pre-warm categories so the step 1 <Select> is populated on
    // first paint (and so hitting "+ add category" doesn't race an
    // in-flight fetch that would repopulate the dropdown).
    return qc.ensureQueryData(pmCampaignCategoriesQuery(companyId))
  },
  component: PmCampaignNewPage,
})
