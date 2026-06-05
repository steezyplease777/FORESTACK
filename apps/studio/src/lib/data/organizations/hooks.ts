import {
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import type { CompanyEditSnapshot } from '@/lib/data/company-editor/server'
import { getCompanyEditSnapshotFn } from '@/lib/data/company-editor/server'
import {
  listOrgCompaniesFn,
  listOrgUsersFn,
  type OrgUserSummary,
} from '@/lib/data/organizations/server'

/**
 * Shared query keys for the org-companies + per-company-snapshot caches.
 *
 * The list and each detail sit under the same `['orgCompanies']` root so
 * one `invalidateQueries({ queryKey: orgCompaniesKeys.all })` after a
 * mutation fans out to both - handy when, say, editing a company's name
 * should refresh both the list row AND the open modal.
 */
export const orgCompaniesKeys = {
  all: ['orgCompanies'] as const,
  list: (orgId: string) => ['orgCompanies', 'list', orgId] as const,
  detail: (companyId: string) =>
    ['orgCompanies', 'detail', companyId] as const,
}

export type OrgCompaniesList = Array<CompanyEditSnapshot>

/**
 * How long cached data is treated as "fresh" before TanStack Query
 * considers it stale.  We use a generous window because:
 *
 *   1. Every write goes through the mutation path in this app, which
 *      explicitly invalidates the `orgCompanies` cache root on success.
 *      That bypasses `staleTime` entirely and forces a refetch - so
 *      stale data after a mutation is impossible.
 *
 *   2. Without a staleTime, every `useQuery` subscribe triggers an
 *      immediate background refetch even when we just seeded the cache
 *      synchronously from the list response.  That defeats the whole
 *      point of "click edit = instant modal" - the modal would show
 *      data on the first frame but a redundant snapshot XHR would
 *      fire right after for no benefit.
 *
 *   3. Cross-user edits (someone else on your org tweaking a company)
 *      are naturally reconciled on next page load / refocus - not a
 *      real-time collaboration product, so "eventually consistent
 *      within a minute of navigation" is plenty.
 */
const COMPANIES_STALE_TIME = 60_000

/**
 * Shared options for the list query so loaders and hooks stay in sync.
 * Declaring it once here means the route loader's `ensureQueryData` and
 * the page's `useQuery` hit the exact same cache entry.
 */
export const orgCompaniesListQuery = (orgId: string) => ({
  queryKey: orgCompaniesKeys.list(orgId),
  queryFn: () => listOrgCompaniesFn({ data: { orgId } }),
  staleTime: COMPANIES_STALE_TIME,
})

export const companySnapshotQuery = (companyId: string) => ({
  queryKey: orgCompaniesKeys.detail(companyId),
  queryFn: () => getCompanyEditSnapshotFn({ data: { companyId } }),
  staleTime: COMPANIES_STALE_TIME,
})

/**
 * Primes the per-company detail cache from a list response.
 *
 * The list endpoint already returns full snapshots, so after the list
 * resolves we can freely write each entry into its own detail key.  The
 * modal then reads from that detail key via `useCompanySnapshot` - zero
 * network round trip between "click edit" and "modal fully hydrated".
 *
 * Call sites:
 *   - Route loader (right after `ensureQueryData` on the list)
 *   - `useOrgCompanies` (on every list refetch, so detail stays in sync)
 */
export function seedCompanyDetailCaches(
  queryClient: QueryClient,
  snapshots: OrgCompaniesList,
) {
  for (const snap of snapshots) {
    queryClient.setQueryData(
      orgCompaniesKeys.detail(snap.company.id),
      snap,
    )
  }
}

/**
 * Apply a post-mutation snapshot to both caches.
 *
 * Every company-editor mutation returns the fresh `CompanyEditSnapshot`
 * for the affected company in the same HTTP round trip as the write.
 * This helper plumbs that response into:
 *
 *   1. The per-company detail cache - drives the open modal.
 *   2. The org companies list cache - drives the row on the list page.
 *
 * Net effect: one network request per mutation, no follow-up refetch,
 * no loading flicker in the modal header, and the list row reflects the
 * new name / logo / etc. the instant the promise resolves.
 *
 * The list update uses `setQueriesData` rather than `setQueryData` so
 * it targets whichever list cache(s) currently hold this company -
 * avoids the caller having to know the org id, and keeps things robust
 * if multiple orgs' lists are warm at the same time (rare, but cheap).
 */
export function applyCompanySnapshot(
  queryClient: QueryClient,
  snap: CompanyEditSnapshot,
) {
  queryClient.setQueryData(
    orgCompaniesKeys.detail(snap.company.id),
    snap,
  )

  queryClient.setQueriesData<OrgCompaniesList>(
    { queryKey: orgCompaniesKeys.list(snap.company.organizationId) },
    (old) =>
      old
        ? old.map((entry) =>
            entry.company.id === snap.company.id ? snap : entry,
          )
        : old,
  )
}

/**
 * The companies list, hot-wired to the TanStack Query cache.  The
 * route loader pre-fills this key via `ensureQueryData`, so the first
 * render never shows a loading state.  Every subsequent refetch re-seeds
 * the per-company detail caches so any open modal stays current.
 */
export function useOrgCompanies(orgId: string) {
  const queryClient = useQueryClient()
  return useQuery({
    ...orgCompaniesListQuery(orgId),
    enabled: !!orgId,
    // Fan out any list refetch into the per-company detail caches so
    // an open modal reflects the latest server state without its own
    // fetch.  `select` runs on every subscription read, which is
    // overkill - but cheap (just N setQueryData writes) and keeps the
    // data-flow declarative.  Use the returned list as-is downstream.
    select: (list: OrgCompaniesList) => {
      seedCompanyDetailCaches(queryClient, list)
      return list
    },
  })
}

/**
 * A single company's full snapshot, keyed on company id.
 *
 * Normal path: the list query already seeded this key, so the hook
 * returns `data` synchronously on first render and never fires a fetch.
 * Cold-start path (deep-link to `?edit=<id>` before the list loaded, or
 * the list cache was garbage-collected): `queryFn` falls back to the
 * single-company snapshot endpoint so the modal still hydrates.
 */
// ---------------------------------------------------------------------
// Org users
// ---------------------------------------------------------------------

/**
 * Shared cache keys for the org-users list.  The Add-member popover in
 * the company editor and the org dashboard's Users page both read from
 * `list(orgId)`, so creating or deleting an org user anywhere in the
 * app surfaces in every view without a bespoke invalidation path.
 */
export const orgUsersKeys = {
  all: ['orgUsers'] as const,
  list: (orgId: string) => ['orgUsers', 'list', orgId] as const,
}

export type OrgUsersList = Array<OrgUserSummary>

const ORG_USERS_STALE_TIME = 60_000

export const orgUsersListQuery = (orgId: string) => ({
  queryKey: orgUsersKeys.list(orgId),
  queryFn: () => listOrgUsersFn({ data: { orgId } }),
  staleTime: ORG_USERS_STALE_TIME,
})

/**
 * Splice a freshly-created org user into the list cache so the UI
 * shows it without a round trip.  Sorted by `created_at ascending` on
 * the server, so new rows go at the end to match.
 */
export function appendOrgUser(
  queryClient: QueryClient,
  orgId: string,
  user: OrgUserSummary,
) {
  queryClient.setQueriesData<OrgUsersList>(
    { queryKey: orgUsersKeys.list(orgId) },
    (old) => {
      if (!old) return [user]
      if (old.some((u) => u.id === user.id)) return old
      return [...old, user]
    },
  )
}

export function useOrgUsers(orgId: string, options?: { enabled?: boolean }) {
  return useQuery({
    ...orgUsersListQuery(orgId),
    enabled: (options?.enabled ?? true) && !!orgId,
  })
}

export function useCompanySnapshot(companyId: string | null) {
  // When `companyId` is null (modal closed), we still need a stable
  // queryKey shape for React Query's internals, but `enabled: false`
  // ensures the `queryFn` never runs.  The `!` assertion inside the
  // queryFn is safe for that reason.
  return useQuery({
    queryKey: orgCompaniesKeys.detail(companyId ?? '__none__'),
    queryFn: () => getCompanyEditSnapshotFn({ data: { companyId: companyId! } }),
    enabled: !!companyId,
    staleTime: COMPANIES_STALE_TIME,
  })
}
