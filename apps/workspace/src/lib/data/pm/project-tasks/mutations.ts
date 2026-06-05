import type { QueryClient } from '@tanstack/react-query'

import { invalidatePmPortalBundle } from '@/lib/data/pm/_shared/invalidate'
import { projectKeys } from '@/lib/data/pm/projects/keys'

import { projectTaskKeys } from './keys'

/**
 * Broad invalidation: any mutation on a task or item could change the
 * list rollup, the drawer's open snapshot, or the PM bundle's task
 * counters on the dashboard.
 */
export function invalidatePmProjectTasks(
  queryClient: QueryClient,
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: projectTaskKeys.list(projectId) })
  queryClient.invalidateQueries({ queryKey: projectTaskKeys.all })
  queryClient.invalidateQueries({
    queryKey: projectTaskKeys.campaignRollups(companyId),
  })
  queryClient.invalidateQueries({
    queryKey: projectKeys.detail(companyId, projectId),
  })
  invalidatePmPortalBundle(queryClient, companySlug)
}
