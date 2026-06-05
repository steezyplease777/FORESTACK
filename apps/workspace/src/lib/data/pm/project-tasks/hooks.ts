import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { invalidatePmProjectTasks } from './mutations'
import {
  pmCampaignTaskRollupQuery,
  pmProjectTaskDetailQuery,
  pmProjectTasksListQuery,
} from './queries'
import {
  createProjectTaskFromTemplateFn,
  createProjectTaskItemFn,
  deleteProjectTaskFn,
  deleteProjectTaskItemFn,
  setProjectTaskAssigneesFn,
  setProjectTaskItemAssigneesFn,
  updateProjectTaskFn,
  updateProjectTaskItemFn,
} from './server'
import type {
  CampaignTaskRollup,
  PmProjectTaskDetail,
  PmProjectTaskItem,
  PmProjectTaskWithRefs,
} from './types'

export type { CampaignTaskRollup } from './types'

export function useCampaignTaskRollup(
  companyId: string,
  campaignId: string,
) {
  return useQuery<CampaignTaskRollup>({
    ...pmCampaignTaskRollupQuery(companyId, campaignId),
    enabled: !!companyId && !!campaignId,
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery<PmProjectTaskWithRefs[]>({
    ...pmProjectTasksListQuery(projectId),
    enabled: !!projectId,
  })
}

export function useProjectTask(projectTaskId: string | null) {
  const id = projectTaskId ?? '__none__'
  return useQuery<PmProjectTaskDetail>({
    ...pmProjectTaskDetailQuery(id),
    enabled: !!projectTaskId,
  })
}

export function useCreateProjectTaskFromTemplate(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      template_id: string
      created_by?: string | null
      status?: string | null
      description?: string | null
      due_date?: string | null
    }) =>
      createProjectTaskFromTemplateFn({
        data: {
          project_id: projectId,
          company_id: companyId,
          ...input,
        },
      }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useUpdateProjectTask(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      patch: Partial<{
        status: string | null
        description: string | null
        due_date: string | null
      }>
    }) => updateProjectTaskFn({ data: input }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useDeleteProjectTask(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) => deleteProjectTaskFn({ data: input }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useSetProjectTaskAssignees(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      project_task_id: string
      company_user_ids: string[]
    }) =>
      setProjectTaskAssigneesFn({
        data: { ...input, company_id: companyId },
      }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useSetProjectTaskItemAssignees(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      project_task_item_id: string
      company_user_ids: string[]
    }) =>
      setProjectTaskItemAssigneesFn({
        data: { ...input, company_id: companyId },
      }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useUpdateProjectTaskItem(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      patch: Partial<
        Pick<PmProjectTaskItem, 'name' | 'description' | 'status' | 'due_date'>
      >
    }) => updateProjectTaskItemFn({ data: input }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useCreateProjectTaskItem(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      project_task_id: string
      name: string
      description?: string | null
      sort_order?: number
    }) =>
      createProjectTaskItemFn({
        data: { ...input, company_id: companyId },
      }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export function useDeleteProjectTaskItem(
  projectId: string,
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) =>
      deleteProjectTaskItemFn({ data: input }),
    onSuccess: () =>
      invalidatePmProjectTasks(qc, projectId, companyId, companySlug),
  })
}

export type {
  PmProjectTask,
  PmProjectTaskDetail,
  PmProjectTaskItem,
  PmProjectTaskItemWithAssignees,
  PmProjectTaskTemplateRef,
  PmProjectTaskWithRefs,
} from './types'
