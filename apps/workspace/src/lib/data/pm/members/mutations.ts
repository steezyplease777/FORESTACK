import type { QueryClient } from '@tanstack/react-query'

import { projectKeys } from '@/lib/data/pm/projects/keys'
import { projectTaskKeys } from '@/lib/data/pm/project-tasks/keys'

import { projectMemberKeys } from './keys'

export function invalidatePmProjectMembers(
  queryClient: QueryClient,
  projectId: string,
  companyId: string,
) {
  queryClient.invalidateQueries({ queryKey: projectMemberKeys.list(projectId) })
  queryClient.invalidateQueries({
    queryKey: projectKeys.detail(companyId, projectId),
  })
  queryClient.invalidateQueries({ queryKey: projectTaskKeys.all })
}
