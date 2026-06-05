import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PmProjectsPage } from '@/features/company/pages/pm/pm-projects-page'
import { pmCampaignsListQuery } from '@/lib/data/pm/campaigns/queries'
import {
  pmProjectsListQuery,
  pmProjectTypesQuery,
} from '@/lib/data/pm/projects/queries'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/data/_shared/pagination'

/**
 * `scope` lets users jump between "standalone-only" (the default,
 * matching the tab's intent) and "all projects across the company"
 * without maintaining two separate routes. Defaulting to
 * `standalone` keeps the tab visually distinct from per-campaign
 * project lists.
 */
const projectsSearch = z.object({
  q: z.string().catch(''),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .catch(DEFAULT_PAGE_SIZE),
  scope: z.enum(['standalone', 'all']).catch('standalone'),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/pm/projects/',
)({
  validateSearch: projectsSearch,
  loaderDeps: ({ search: { page, pageSize, q, scope } }) => ({
    page,
    pageSize,
    q,
    scope,
  }),
  loader: ({ context, deps }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    const { page, pageSize, q, scope } = deps
    return Promise.all([
      qc.ensureQueryData(
        pmProjectsListQuery(companyId, { scope, page, pageSize, q }),
      ),
      // Project types + a big first-page of campaigns are needed
      // by the edit/create modal's selects. Warmed in the loader
      // so the modal opens populated on first click.
      qc.ensureQueryData(pmProjectTypesQuery(companyId)),
      qc.ensureQueryData(
        pmCampaignsListQuery(companyId, { pageSize: 200 }),
      ),
    ])
  },
  component: PmProjectsPage,
})
