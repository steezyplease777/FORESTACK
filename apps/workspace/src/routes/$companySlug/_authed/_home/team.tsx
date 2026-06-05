import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { TeamPage } from '@/features/company/pages/home/team-page'
import {
  companyTeamQuery,
  seedTeamMemberCaches,
} from '@/lib/data/team/hooks'

const teamSearch = z.object({
  tab: z.enum(['company', 'department']).catch('company'),
  member: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/$companySlug/_authed/_home/team')({
  validateSearch: teamSearch,
  // Pre-fetch the team list AND seed per-member detail caches so the
  // member-detail sheet opens fully hydrated on the same tick as the
  // click (and on deep-links like `/team?member=<id>` too). Mirrors the
  // saas-portal company edit modal's hydration pattern.
  loader: async ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const list = await context.queryClient.ensureQueryData(
      companyTeamQuery(companyId),
    )
    seedTeamMemberCaches(context.queryClient, companyId, list)
    return null
  },
  component: TeamPage,
})
