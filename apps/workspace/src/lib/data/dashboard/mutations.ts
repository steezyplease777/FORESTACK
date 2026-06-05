import type { QueryClient } from '@tanstack/react-query'

import { dashboardKeys } from './keys'
import type { DashboardPortalSlug } from './types'

/**
 * Invalidate dashboard bundle cache after entity mutations that affect
 * portal metrics. Omit `portals` to refresh all bundle key variants for the slug.
 */
export function invalidateDashboardBundle(
  queryClient: QueryClient,
  companySlug: string,
  portals?: readonly DashboardPortalSlug[],
) {
  if (portals?.length) {
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.bundle(companySlug, portals),
    })
    return
  }

  queryClient.invalidateQueries({
    queryKey: [...dashboardKeys.all, 'bundle', companySlug],
    exact: false,
  })
}
