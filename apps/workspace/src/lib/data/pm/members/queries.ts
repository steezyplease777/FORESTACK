import { DEFAULT_LIST_STALE_TIME } from '@/lib/data/_shared/query-policy'

import { projectMemberKeys } from './keys'
import { getProjectMembers } from './server'
import type { PmProjectMemberWithUser } from './types'

export function pmProjectMembersListQuery(projectId: string) {
  return {
    queryKey: projectMemberKeys.list(projectId),
    queryFn: () => getProjectMembers({ data: { projectId } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof projectMemberKeys.list>
    queryFn: () => Promise<PmProjectMemberWithUser[]>
    staleTime: number
  }
}
