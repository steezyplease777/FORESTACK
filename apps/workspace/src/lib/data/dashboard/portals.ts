import type { DashboardPortalSlug } from './types'

/** All portal slugs that can contribute dashboard slices. */
export const DASHBOARD_PORTAL_SLUGS = [
  'home',
  'plm',
  'pm',
  'erp',
  'crm',
  'wms',
] as const satisfies readonly DashboardPortalSlug[]

const PORTAL_SET = new Set<string>(DASHBOARD_PORTAL_SLUGS)

export function isDashboardPortalSlug(
  value: string,
): value is DashboardPortalSlug {
  return PORTAL_SET.has(value)
}

/**
 * Normalizes portal selection for stable query keys and server input.
 * - `undefined` → all portals
 * - dedupes + sorts alphabetically
 */
export function resolveDashboardPortals(
  portals?: readonly DashboardPortalSlug[],
): DashboardPortalSlug[] {
  const source =
    portals && portals.length > 0 ? portals : DASHBOARD_PORTAL_SLUGS
  return [...new Set(source)].sort() as DashboardPortalSlug[]
}

/** Parse `?portals=plm,crm` style input (e.g. HTTP route search params). */
export function parseDashboardPortalsParam(
  raw: string | string[] | undefined,
): DashboardPortalSlug[] | undefined {
  if (raw == null) return undefined
  const parts = Array.isArray(raw)
    ? raw
    : raw.split(',').map((s) => s.trim())
  const slugs = parts.filter(isDashboardPortalSlug)
  return slugs.length > 0 ? resolveDashboardPortals(slugs) : undefined
}
