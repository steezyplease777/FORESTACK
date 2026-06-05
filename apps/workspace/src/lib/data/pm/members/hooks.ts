import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidatePmProjectMembers } from './mutations'
import { pmProjectMembersListQuery } from './queries'
import {
  addProjectMemberFn,
  removeProjectMemberFn,
  updateProjectMemberRoleFn,
} from './server'
import type { PmProjectMemberWithUser } from './types'

export function useProjectMembers(projectId: string) {
  return useQuery<PmProjectMemberWithUser[]>({
    ...pmProjectMembersListQuery(projectId),
    enabled: !!projectId,
  })
}

export function useAddProjectMember(projectId: string, companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      company_user_id: string
      role?: string | null
    }) =>
      addProjectMemberFn({
        data: {
          project_id: projectId,
          company_id: companyId,
          company_user_id: input.company_user_id,
          role: input.role ?? null,
        },
      }),
    onSuccess: () => invalidatePmProjectMembers(qc, projectId, companyId),
  })
}

export function useUpdateProjectMemberRole(
  projectId: string,
  companyId: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; role: string | null }) =>
      updateProjectMemberRoleFn({ data: input }),
    onSuccess: () => invalidatePmProjectMembers(qc, projectId, companyId),
  })
}

export function useRemoveProjectMember(projectId: string, companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) =>
      removeProjectMemberFn({ data: input }),
    onSuccess: () => invalidatePmProjectMembers(qc, projectId, companyId),
  })
}

export type { PmProjectMember, PmProjectMemberWithUser } from './types'
