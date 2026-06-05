import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

import {
  loadSaasSessionStatus,
  type SaasSessionStatus,
} from '@/lib/data/auth/saas-session'

/**
 * Gate for every protected saas-portal route (`/app/*`, etc.). All branching
 * logic lives in `loadSaasSessionStatus` so this file only describes what
 * "authed" means in terms of redirects.
 *
 * What we do NOT check here anymore: having at least one OWNER/ADMIN
 * membership. A user with zero `saas_orgs` still reaches `/app` - they just
 * land on the empty-state "Create organization" page. Per-org routes
 * (/app/org/:orgId/*) are where we reject access based on the `saas_orgs`
 * claim, because the decision is tied to the concrete org id and a 404 is
 * the right response (non-existent to the caller).
 *
 * The session fetch is cached via `queryClient.ensureQueryData` with a short
 * `staleTime` so re-navigations within an authenticated area (e.g. opening
 * a modal via `?edit=<id>`, switching tabs) don't re-hit the server. Without
 * this, every `navigate({ search: ... })` would serially refetch the session
 * before committing the URL change - measurable as a ~500ms dead-window
 * before modals mount.
 */
const saasSessionQueryKey = ['saasSession'] as const

const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location, context }) => {
    const session = await context.queryClient.ensureQueryData<SaasSessionStatus>({
      queryKey: saasSessionQueryKey,
      queryFn: () => loadSaasSessionStatus(),
      staleTime: 30_000,
    })
    if (session.status === 'wrong-host') {
      throw redirect({ href: session.redirectTo })
    }
    if (session.status === 'unauthed') {
      throw redirect({
        to: '/login',
        search: { redirect: location.href } as any,
      })
    }
    return { session }
  },
  component: () => <Outlet />,
})

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route, saasSessionQueryKey }
