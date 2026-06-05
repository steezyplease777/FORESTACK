import { createFileRoute } from '@tanstack/react-router'

import { PmProjectDetailPage } from '@/features/company/pages/pm/pm-project-detail-page'
import { pmCampaignsListQuery } from '@/lib/data/pm/campaigns/queries'
import { pmProjectMembersListQuery } from '@/lib/data/pm/members/queries'
import { pmProjectTasksListQuery } from '@/lib/data/pm/project-tasks/queries'
import {
  pmProjectDetailQuery,
  pmProjectTypesQuery,
} from '@/lib/data/pm/projects/queries'
import {
  pmTaskCategoriesQuery,
  pmTaskTemplatesListQuery,
} from '@/lib/data/pm/task-templates/queries'

export const Route = createFileRoute(
  '/$companySlug/_authed/pm/projects/$projectId',
)({
  loader: ({ context, params }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    return Promise.all([
      qc.ensureQueryData(
        pmProjectDetailQuery(companyId, params.projectId),
      ),
      // Warm the dropdowns the Edit modal renders so the first open
      // is already populated (types for the type selector, campaigns
      // for the campaign re-parenting selector).
      qc.ensureQueryData(pmProjectTypesQuery(companyId)),
      qc.ensureQueryData(
        pmCampaignsListQuery(companyId, { pageSize: 200 }),
      ),
      // Warm the project's members + tasks and the company-wide template
      // library so the dashboard renders without loading spinners on
      // navigation. Templates are cached for 5 min so this is cheap.
      qc.ensureQueryData(
        pmProjectMembersListQuery(params.projectId),
      ),
      qc.ensureQueryData(pmProjectTasksListQuery(params.projectId)),
      qc.ensureQueryData(pmTaskTemplatesListQuery(companyId)),
      qc.ensureQueryData(pmTaskCategoriesQuery(companyId)),
    ])
  },
  component: PmProjectDetailPage,
})
