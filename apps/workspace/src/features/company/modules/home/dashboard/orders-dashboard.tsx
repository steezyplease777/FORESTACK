// @ts-nocheck
import { startTransition } from 'react'
import { getRouteApi } from '@tanstack/react-router'

import { Skeleton } from '@/components/ui/skeleton'
import { DashboardStatCards } from './dashboard-stat-cards'
import { SalesChannelFilter } from './sales-channel-filter'
import { OrdersChart } from './orders-chart'
import { useOrdersDashboardView } from './hooks/use-orders-dashboard'

const routeApi = getRouteApi('/$companySlug/_authed/_home/dashboard')

type Props = {
  companySlug: string
}

export function OrdersDashboard({ companySlug }: Props) {
  // URL is the source of truth: `?days=90&channels=id1,id2`. The route loader
  // primed the cache with a single superset bundle; `useOrdersDashboardView`
  // reads that bundle and derives the stats + time-series view for the
  // current filter in JS. Filter toggles never hit the network.
  const { days, channels } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  // Toggling a filter triggers a URL search update, which re-derives the
  // view (including the per-day padding loop) and re-renders the recharts
  // tree. Running that inside the click handler produced ~150ms "'click'
  // handler took …ms" violations. Marking the navigation as a transition
  // defers the commit to a low-priority render pass so the click handler
  // itself stays fast.
  const setChannels = (next: string[]) => {
    startTransition(() => {
      navigate({ search: (prev) => ({ ...prev, channels: next }) })
    })
  }

  const setDays = (next: number) => {
    startTransition(() => {
      navigate({ search: (prev) => ({ ...prev, days: next }) })
    })
  }

  const { view, isLoading } = useOrdersDashboardView(
    companySlug,
    days,
    channels,
  )

  const isInitialLoading = isLoading && !view

  return (
    <div className="flex flex-col gap-4">
      <div className="px-4 lg:px-6">
        {isInitialLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <SalesChannelFilter
            channels={view?.salesChannels ?? []}
            selected={channels}
            onChange={setChannels}
          />
        )}
      </div>

      <DashboardStatCards stats={view?.stats} isLoading={isInitialLoading} />

      <div className="px-4 lg:px-6">
        <OrdersChart
          timeSeries={view?.timeSeries}
          isLoading={isInitialLoading}
          days={days}
          onDaysChange={setDays}
        />
      </div>
    </div>
  )
}
