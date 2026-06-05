import { DEFAULT_LIST_STALE_TIME } from '@/lib/data/_shared/query-policy'

import { projectTaskKeys } from './keys'
import {
  getCampaignTaskStatuses,
  getProjectTask,
  getProjectTasks,
} from './server'
import type {
  CampaignTaskRollup,
  PmProjectTaskDetail,
  PmProjectTaskWithRefs,
} from './types'

export function pmProjectTasksListQuery(projectId: string) {
  return {
    queryKey: projectTaskKeys.list(projectId),
    queryFn: () => getProjectTasks({ data: { projectId } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof projectTaskKeys.list>
    queryFn: () => Promise<PmProjectTaskWithRefs[]>
    staleTime: number
  }
}

export function pmProjectTaskDetailQuery(projectTaskId: string) {
  return {
    queryKey: projectTaskKeys.detail(projectTaskId),
    queryFn: () => getProjectTask({ data: { projectTaskId } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof projectTaskKeys.detail>
    queryFn: () => Promise<PmProjectTaskDetail>
    staleTime: number
  }
}

/**
 * Bucketed status counts for all tasks across every project in a
 * campaign. The server returns raw status strings; bucketing happens
 * here so we can adjust the mapping without a migration.
 */
export function pmCampaignTaskRollupQuery(
  companyId: string,
  campaignId: string,
) {
  return {
    queryKey: projectTaskKeys.campaignRollup(companyId, campaignId),
    queryFn: async (): Promise<CampaignTaskRollup> => {
      const rows = await getCampaignTaskStatuses({
        data: { companyId, campaignId },
      })
      const bucket = { open: 0, in_progress: 0, blocked: 0, done: 0 }
      for (const { status } of rows) {
        if (status === 'in_progress') bucket.in_progress++
        else if (status === 'blocked') bucket.blocked++
        else if (status === 'done') bucket.done++
        else bucket.open++
      }
      return { total: rows.length, byStatus: bucket }
    },
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof projectTaskKeys.campaignRollup>
    queryFn: () => Promise<CampaignTaskRollup>
    staleTime: number
  }
}
