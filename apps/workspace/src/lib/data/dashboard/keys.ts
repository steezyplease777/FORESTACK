import { resolveDashboardPortals } from './portals'
import type { DashboardPortalSlug } from './types'

export const dashboardKeys = {
  all: ['dashboard'] as const,

  /**
   * Modular bundle keyed by slug + sorted portal list so partial fetches
   * (`['home']` vs `['home','pm']`) stay distinct in the cache.
   */
  bundle: (
    companySlug: string,
    portals?: readonly DashboardPortalSlug[],
  ) =>
    [
      ...dashboardKeys.all,
      'bundle',
      companySlug,
      ...resolveDashboardPortals(portals),
    ] as const,

  /** @deprecated Prefer `bundle(companySlug, ['home'])` — kept for migration. */
  ordersDashboard: (companySlug: string) =>
    [...dashboardKeys.all, 'orders', companySlug] as const,
}
