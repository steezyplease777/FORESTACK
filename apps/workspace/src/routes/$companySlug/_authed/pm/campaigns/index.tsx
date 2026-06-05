import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PmCampaignsPage } from '@/features/company/pages/pm/pm-campaigns-page'
import {
  pmCampaignCategoriesQuery,
  pmCampaignsListQuery,
} from '@/lib/data/pm/campaigns/queries'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/data/_shared/pagination'

const campaignsSearch = z.object({
  q: z.string().catch(''),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .catch(DEFAULT_PAGE_SIZE),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/pm/campaigns/',
)({
  validateSearch: campaignsSearch,
  // Include the validated search in the loader deps so moving
  // between pages or searching triggers the prefetch for the new
  // (page, q) combination.
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: ({ context, deps }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    const { page, pageSize, q } = deps
    return Promise.all([
      qc.ensureQueryData(
        pmCampaignsListQuery(companyId, { page, pageSize, q }),
      ),
      qc.ensureQueryData(pmCampaignCategoriesQuery(companyId)),
    ])
  },
  component: PmCampaignsPage,
})
