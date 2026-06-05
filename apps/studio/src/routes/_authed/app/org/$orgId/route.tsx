import { Outlet, createFileRoute, notFound } from '@tanstack/react-router'

import { getMyOrganizationFn } from '@/lib/data/organizations/server'

/**
 * Parent for every `/app/org/:orgId/*` route. Two gates:
 *
 *   1. SaaS-access claim: the orgId must appear in the session's
 *      `saasOrgIds` (populated from the JWT `saas_orgs` claim, which only
 *      contains orgs where the user is OWNER or ADMIN). A COMPANY-only
 *      user who hand-crafts a URL gets 404 - not a redirect - so the
 *      saas portal never reveals whether such an org exists.
 *   2. Membership data: `getMyOrganizationFn` does a second check via an
 *      `!inner` join for defense-in-depth and returns the full org detail
 *      needed by leaf routes.
 *
 * The org fetch is cached via `queryClient.ensureQueryData` so in-route
 * navigations (tab switches, search-param mutations like the modal's
 * `?edit=<id>`) don't re-hit the server. Without this, every
 * `navigate({ search: ... })` serially refetches the org before committing
 * the URL change, adding ~500ms of "dead" time before modals mount.
 *
 * The loaded org is exposed via route context so leaf routes
 * (`dashboard`, `companies`, `users`) can render headers / breadcrumbs
 * without re-fetching.
 */
const orgQueryKey = (orgId: string) => ['myOrganization', orgId] as const

const Route = createFileRoute('/_authed/app/org/$orgId')({
  beforeLoad: async ({ params, context }) => {
    // Fast-path claim check: if the session's `saas_orgs` claim is
    // populated AND it says this orgId isn't in it, 404 immediately
    // without hitting the DB. We only trust a non-empty claim here
    // because an empty array is indistinguishable from "hook isn't
    // enabled yet" during the rollout window. When the claim is empty
    // we fall through to `getMyOrganizationFn`, which is authoritative:
    // it filters `role in ('OWNER','ADMIN')` at the DB level and
    // returns null for COMPANY-only members.
    const claim = context.session?.status === 'ok'
      ? context.session.saasOrgIds
      : []
    if (claim.length > 0 && !claim.includes(params.orgId)) {
      throw notFound()
    }

    const org = await context.queryClient.ensureQueryData({
      queryKey: orgQueryKey(params.orgId),
      queryFn: () => getMyOrganizationFn({ data: { orgId: params.orgId } }),
      staleTime: 60_000,
    })
    if (!org) throw notFound()
    return { org }
  },
  loader: ({ context }) => ({ org: context.org }),
  component: () => <Outlet />,
})

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route, orgQueryKey }
