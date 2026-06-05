import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { DashboardPage } from '@/features/company/pages/home/dashboard-page'
import { homeDashboardQuery } from '@/lib/data/dashboard/queries'

const ALLOWED_DAYS = [0, 7, 30, 90, 365] as const

// URL is the source of truth for the chart window + channel filters so the
// view is shareable, back-button-friendly, and SSR-hydratable. Defaults
// match the Next.js behaviour (90-day range, all channels).
const dashboardSearchSchema = z.object({
  days: z
    .number()
    .refine((n): n is (typeof ALLOWED_DAYS)[number] =>
      (ALLOWED_DAYS as readonly number[]).includes(n),
    )
    .catch(90),
  channels: z.array(z.string()).catch([]),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/_home/dashboard',
)({
  validateSearch: dashboardSearchSchema,
  // Filters are pure URL state - the loader intentionally does NOT depend on
  // them and runs only once on route entry to prime the React Query cache.
  // The RPC returns a superset bundle (365-day series + per-channel stats);
  // every subsequent filter flip (`?channels=...`, `?days=...`) is resolved
  // from that cached bundle by `useOrdersDashboardView` in JS, with zero
  // round-trips for 30 minutes.
  loader: ({ context, params }) => {
    const { queryClient } = context
    const { companySlug } = params
    return queryClient.ensureQueryData(homeDashboardQuery(companySlug))
  },
  component: DashboardPage,
})
