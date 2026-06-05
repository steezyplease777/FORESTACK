import {
  BUNDLE_GC_TIME,
  BUNDLE_STALE_TIME,
} from '@/lib/data/_shared/query-policy'

import { dashboardKeys } from './keys'
import { getDashboardBundle } from './server'
import type { DashboardBundle, DashboardPortalSlug } from './types'

export type DashboardBundleQueryOptions = {
  portals?: readonly DashboardPortalSlug[]
}

/**
 * Shared query factory for route loaders and hooks. Keyed by slug + sorted
 * portal list so `['home']` and full-bundle fetches do not collide.
 */
export function dashboardBundleQuery(
  companySlug: string,
  options: DashboardBundleQueryOptions = {},
) {
  const { portals } = options

  return {
    queryKey: dashboardKeys.bundle(companySlug, portals),
    queryFn: () =>
      getDashboardBundle({
        data: {
          companySlug,
          portals: portals ? [...portals] : undefined,
        },
      }),
    staleTime: BUNDLE_STALE_TIME,
    gcTime: BUNDLE_GC_TIME,
  } satisfies {
    queryKey: ReturnType<typeof dashboardKeys.bundle>
    queryFn: () => Promise<DashboardBundle>
    staleTime: number
    gcTime: number
  }
}

/** Home-only slice (orders dashboard) — used by the `/dashboard` route. */
export function homeDashboardQuery(companySlug: string) {
  return dashboardBundleQuery(companySlug, { portals: ['home'] })
}
