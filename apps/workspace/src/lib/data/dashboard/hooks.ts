import { useQuery } from '@tanstack/react-query'

import {
  dashboardBundleQuery,
  type DashboardBundleQueryOptions,
} from './queries'
import type { DashboardBundle } from './types'

export type UseDashboardBundleOptions = DashboardBundleQueryOptions

/**
 * Client hook for the modular dashboard bundle. Matches the route loader
 * query factory so SSR-primed cache is reused on hydration.
 */
export function useDashboardBundle(
  companySlug: string,
  options: UseDashboardBundleOptions = {},
) {
  const query = dashboardBundleQuery(companySlug, options)

  return useQuery<DashboardBundle>({
    ...query,
    enabled: !!companySlug,
  })
}

/** Convenience wrapper for the home portal slice only. */
export function useHomeDashboard(companySlug: string) {
  return useDashboardBundle(companySlug, { portals: ['home'] })
}
