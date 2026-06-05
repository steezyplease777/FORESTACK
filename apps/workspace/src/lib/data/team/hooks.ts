// @ts-nocheck
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'

import { getCompanyUsers, getDepartmentTeam } from './server'
import type { TeamMember } from './client'

/**
 * Team-page data flow mirrors the saas-portal company edit modal:
 *
 *   1. Route loader pre-fetches the full member list and seeds each
 *      member into a per-id detail cache via `seedTeamMemberCaches`.
 *   2. The list hooks (`useCompanyTeam`, `useDepartmentTeam`) re-seed
 *      those detail caches on every refetch via `select`, so an open
 *      sheet stays in sync without its own fetch.
 *   3. `useTeamMember(companyId, memberId)` reads from the per-id cache
 *      and paints the member detail sheet synchronously on the same
 *      tick as the click - no network hop, no loading flicker.
 *   4. Deep-link (`/team?member=<id>` on a cold tab): the loader has
 *      already resolved the list by the time the page mounts, so the
 *      per-id cache is populated before the sheet reads it.
 *
 * See `src/lib/data/organizations/hooks.ts` for the original pattern.
 */
const teamKeys = {
  all: (companyId: string) => ['team', companyId] as const,
  company: (companyId: string) => [...teamKeys.all(companyId), 'company'] as const,
  department: (companyId: string, userId: string) =>
    [...teamKeys.all(companyId), 'department', userId] as const,
  member: (companyId: string, memberId: string) =>
    [...teamKeys.all(companyId), 'member', memberId] as const,
}

const TEAM_STALE_TIME = 60_000

export const companyTeamQuery = (companyId: string) => ({
  queryKey: teamKeys.company(companyId),
  queryFn: () => getCompanyUsers({ data: { companyId } }),
  staleTime: TEAM_STALE_TIME,
})

export const departmentTeamQuery = (
  companyId: string,
  currentUserCompanyUserId: string,
) => ({
  queryKey: teamKeys.department(companyId, currentUserCompanyUserId),
  queryFn: () =>
    getDepartmentTeam({ data: { companyId, currentUserCompanyUserId } }),
  staleTime: TEAM_STALE_TIME,
})

/**
 * Fan a resolved team list out into per-member detail caches so the
 * sheet can read synchronously from cache. Cheap - just N setQueryData
 * calls, and idempotent (writing the same reference back is a no-op
 * from the subscriber's perspective).
 */
export function seedTeamMemberCaches(
  queryClient: QueryClient,
  companyId: string,
  members: TeamMember[],
) {
  for (const m of members) {
    queryClient.setQueryData(teamKeys.member(companyId, m.id), m)
  }
}

export function useCompanyTeam(companyId: string) {
  const queryClient = useQueryClient()
  return useQuery({
    ...companyTeamQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
    // `select` runs on every subscription read, which is overkill -
    // but cheap (just N setQueryData writes) and keeps the data flow
    // declarative. Mirrors `useOrgCompanies`.
    select: (list: TeamMember[]) => {
      seedTeamMemberCaches(queryClient, companyId, list)
      return list
    },
  })
}

export function useDepartmentTeam(
  companyId: string,
  currentUserCompanyUserId: string,
) {
  const queryClient = useQueryClient()
  return useQuery({
    ...departmentTeamQuery(companyId, currentUserCompanyUserId),
    enabled: !!companyId && !!currentUserCompanyUserId,
    placeholderData: keepPreviousData,
    select: (data: { members: TeamMember[]; departmentName: string | null }) => {
      seedTeamMemberCaches(queryClient, companyId, data.members)
      return data
    },
  })
}

/**
 * A single team member, keyed on member id.
 *
 * Normal path: the list query already seeded this key, so the hook
 * returns `data` synchronously on first render and never fires a
 * fetch (there's no per-member endpoint - the list returns full
 * records). If the cache was evicted we refetch the list and pull the
 * member out of it.
 */
export function useTeamMember(companyId: string, memberId: string | null) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: teamKeys.member(companyId, memberId ?? '__none__'),
    queryFn: async () => {
      if (!memberId) return null
      const list = await queryClient.ensureQueryData(companyTeamQuery(companyId))
      seedTeamMemberCaches(queryClient, companyId, list)
      return list.find((m) => m.id === memberId) ?? null
    },
    enabled: !!companyId && !!memberId,
    staleTime: TEAM_STALE_TIME,
  })
}

export { teamKeys }
