// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { getCrmBundle } from '@/lib/data/portal-bundles/crm/server'
import { getErpBundle } from '@/lib/data/portal-bundles/erp/server'
import { getPlmBundle } from '@/lib/data/portal-bundles/plm/server'
import { getPmBundle } from '@/lib/data/portal-bundles/pm/server'
import { getWmsBundle } from '@/lib/data/portal-bundles/wms/server'
import { createClient } from '@/lib/datasource/supabase/server'

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
    const { companySlug } = data
    const supabase = createClient()

    const { data: bundle, error } = await supabase.rpc(
      'get_orders_dashboard',
      { p_company_slug: companySlug },
    )

    if (error) {
      if (error.message?.includes('not_authenticated')) {
        throw new Error('Unauthorized')
      }
      if (error.message?.includes('company_not_found')) {
        throw new Error('Company not found')
      }
      if (error.message?.includes('not_company_member')) {
        throw new Error('Forbidden')
      }
      throw new Error(error.message)
    }

    return bundle as unknown as OrdersDashboardData
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
      tasks.push(
        getOrdersDashboard({ data: { companySlug } }).then((orders) => {
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
