import type { CrmBundle } from '@/lib/data/portal-bundles/crm/types'
import type { ErpBundle } from '@/lib/data/portal-bundles/erp/types'
import type { PlmBundle } from '@/lib/data/portal-bundles/plm/types'
import type { PmBundle } from '@/lib/data/portal-bundles/pm/types'
import type { WmsBundle } from '@/lib/data/portal-bundles/wms/types'

/** Portal slugs aligned with `modules.registry.ts` + home. */
export type DashboardPortalSlug =
  | 'home'
  | 'plm'
  | 'pm'
  | 'erp'
  | 'crm'
  | 'wms'

export type SalesChannelTab = {
  id: string
  name: string
  channelCode: string
}

export type DashboardStats = {
  revenue7d: number
  orderCount7d: number
}

/**
 * An individual `wms_order_channel`. `salesChannelId` lets the client map
 * a user's sales-channel selection to the order channels that belong to
 * it, so all filtering can happen in JS off the single cached bundle.
 */
export type OrderChannel = {
  id: string
  name: string
  salesChannelId: string | null
}

export type OrderTimeSeriesPoint = {
  date: string
  [channelName: string]: number | string
}

export type OrderTimeSeries = {
  data: OrderTimeSeriesPoint[]
  channels: OrderChannel[]
}

/**
 * Raw bundle returned by the `get_orders_dashboard` RPC. It's intentionally
 * a *superset* of any single view: the UI toggles (sales-channel filter,
 * days window) are computed client-side from this object, keyed by
 * `companySlug` alone. One network round-trip per 30-min cache window -
 * every filter flip after that is a sub-millisecond JS derivation.
 */
export type OrdersDashboardData = {
  salesChannels: SalesChannelTab[]
  orderChannels: OrderChannel[]
  statsByOrderChannel: Record<string, DashboardStats>
  statsUnattributed: DashboardStats
  timeSeries: OrderTimeSeries
}

/** Home portal dashboard slice (orders chart + stat cards today). */
export type HomeDashboardSlice = {
  orders: OrdersDashboardData
}

/**
 * Modular dashboard bundle keyed by portal. Only requested portals are
 * populated — callers pass `portals` to limit RPC fan-out.
 */
export type DashboardBundle = {
  home?: HomeDashboardSlice
  plm?: PlmBundle
  pm?: PmBundle
  erp?: ErpBundle
  crm?: CrmBundle
  wms?: WmsBundle
}
