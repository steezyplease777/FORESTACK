// @ts-nocheck
import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { homeDashboardQuery } from '@/lib/data/dashboard/queries'
import type {
  DashboardStats,
  OrderTimeSeries,
  OrdersDashboardData,
} from '@/lib/data/dashboard/types'

/**
 * Reads the full orders dashboard bundle for a tenant.
 *
 * Reads the home slice from the modular dashboard bundle (`portals: ['home']`).
 * Query key deliberately does NOT include `days` or `channels` — filter UI
 * is derived client-side via `useOrdersDashboardView`.
 */
export function useOrdersDashboard(companySlug: string) {
  const query = homeDashboardQuery(companySlug)

  return useQuery({
    ...query,
    enabled: !!companySlug,
    select: (bundle) => bundle.home?.orders,
  })
}

export type OrdersDashboardView = {
  salesChannels: OrdersDashboardData['salesChannels']
  stats: DashboardStats
  timeSeries: OrderTimeSeries
}

/**
 * Derives the filter-applied view from a raw bundle.
 *
 * - Stats: sum `statsByOrderChannel` entries whose channel's
 *   `salesChannelId` is in the current selection. When no filter is
 *   active we additionally include `statsUnattributed` to mirror the
 *   prior server-side "all orders" behaviour.
 * - Time series: narrow `channels` to the selected channels and trim
 *   `data` to the requested window. Extra keys on each data point are
 *   harmless — the chart only renders channels listed in `channels`.
 *
 * Pure function, memoised inside `useOrdersDashboardView` so the derivation
 * only re-runs when the bundle or URL-state actually changes.
 */
export function deriveOrdersDashboardView(
  bundle: OrdersDashboardData | undefined,
  days: number,
  salesChannelIds: string[],
): OrdersDashboardView | undefined {
  if (!bundle) return undefined

  const hasFilter = salesChannelIds.length > 0
  const filterSet = new Set(salesChannelIds)

  const selectedOrderChannels = hasFilter
    ? bundle.orderChannels.filter(
        (oc) => oc.salesChannelId && filterSet.has(oc.salesChannelId),
      )
    : bundle.orderChannels

  let revenue7d = 0
  let orderCount7d = 0
  for (const oc of selectedOrderChannels) {
    const s = bundle.statsByOrderChannel[oc.id]
    if (!s) continue
    revenue7d += Number(s.revenue7d) || 0
    orderCount7d += Number(s.orderCount7d) || 0
  }
  if (!hasFilter && bundle.statsUnattributed) {
    revenue7d += Number(bundle.statsUnattributed.revenue7d) || 0
    orderCount7d += Number(bundle.statsUnattributed.orderCount7d) || 0
  }

  // For a bounded window we pad the series out to the full requested span so
  // the x-axis always visually reflects the selected range, even when the
  // tenant's history is shorter than `days`. The RPC only emits rows from
  // `min(created_at)` forward, so without padding, "Last year" and "Last 30
  // days" would look identical for a tenant with <30 days of data.
  // For "All time" (days === 0) we use whatever the server returned — that
  // already spans the full history.
  const data =
    days > 0
      ? (() => {
          const today = new Date()
          today.setUTCHours(0, 0, 0, 0)
          const start = new Date(today)
          start.setUTCDate(today.getUTCDate() - (days - 1))

          const existing = new Map<string, (typeof bundle.timeSeries.data)[number]>()
          for (const row of bundle.timeSeries.data) {
            existing.set(row.date as string, row)
          }

          const emptyRow: Record<string, number> = {}
          for (const ch of bundle.orderChannels) {
            emptyRow[ch.name] = 0
          }

          const out: (typeof bundle.timeSeries.data)[number][] = []
          const cursor = new Date(start)
          while (cursor <= today) {
            const iso = cursor.toISOString().slice(0, 10)
            out.push(existing.get(iso) ?? { date: iso, ...emptyRow })
            cursor.setUTCDate(cursor.getUTCDate() + 1)
          }
          return out
        })()
      : bundle.timeSeries.data

  return {
    salesChannels: bundle.salesChannels,
    stats: { revenue7d, orderCount7d },
    timeSeries: {
      channels: selectedOrderChannels,
      data,
    },
  }
}

export function useOrdersDashboardView(
  companySlug: string,
  days: number,
  salesChannelIds: string[],
) {
  const query = useOrdersDashboard(companySlug)

  const view = React.useMemo(
    () => deriveOrdersDashboardView(query.data, days, salesChannelIds),
    [query.data, days, salesChannelIds],
  )

  return {
    view,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  }
}
