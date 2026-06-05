// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { getCrmBundle } from '@/lib/data/portal-bundles/crm/server'
import { getErpBundle } from '@/lib/data/portal-bundles/erp/server'
import { getPlmBundle } from '@/lib/data/portal-bundles/plm/server'
import { getPmBundle } from '@/lib/data/portal-bundles/pm/server'
import { getWmsBundle } from '@/lib/data/portal-bundles/wms/server'
import { fetchOrdersDashboard } from './fetch-orders-dashboard.server'
import { resolveDashboardPortals } from './portals'
import type { DashboardBundle, DashboardPortalSlug, OrdersDashboardData } from './types'

/**
 * Orders dashboard aggregation.
 *
 * Returns a superset bundle for a company so the dashboard can be driven
 * by URL-state alone on subsequent interactions: the sales-channel filter
 * and the time-window picker are computed entirely client-side from this
 * single response.
 */
export const getOrdersDashboard = createServerFn({ method: 'GET' })
  .inputValidator((data: { companySlug: string }) => data)
  .handler(async ({ data }): Promise<OrdersDashboardData> => {
    return fetchOrdersDashboard(data.companySlug)
  })

/**
 * Modular dashboard bundle — composes existing portal-bundle server fns and
 * the home orders RPC. Pass `portals` to limit fan-out; omit to fetch all.
 */
export const getDashboardBundle = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { companySlug: string; portals?: DashboardPortalSlug[] }) => data,
  )
  .handler(async ({ data }): Promise<DashboardBundle> => {
    const { companySlug } = data
    const portals = resolveDashboardPortals(data.portals)
    const bundle: DashboardBundle = {}

    const tasks: Promise<void>[] = []

    if (portals.includes('home')) {
      // Inline the RPC in-process so nested server-fn HTTP does not drop
      // the WorkOS httpOnly cookie from the parent handler's request.
      tasks.push(
        fetchOrdersDashboard(companySlug).then((orders) => {
          bundle.home = { orders }
        }),
      )
    }
    if (portals.includes('plm')) {
      tasks.push(
        getPlmBundle({ data: { companySlug } }).then((plm) => {
          bundle.plm = plm
        }),
      )
    }
    if (portals.includes('pm')) {
      tasks.push(
        getPmBundle({ data: { companySlug } }).then((pm) => {
          bundle.pm = pm
        }),
      )
    }
    if (portals.includes('erp')) {
      tasks.push(
        getErpBundle({ data: { companySlug } }).then((erp) => {
          bundle.erp = erp
        }),
      )
    }
    if (portals.includes('crm')) {
      tasks.push(
        getCrmBundle({ data: { companySlug } }).then((crm) => {
          bundle.crm = crm
        }),
      )
    }
    if (portals.includes('wms')) {
      tasks.push(
        getWmsBundle({ data: { companySlug } }).then((wms) => {
          bundle.wms = wms
        }),
      )
    }

    await Promise.all(tasks)
    return bundle
  })
