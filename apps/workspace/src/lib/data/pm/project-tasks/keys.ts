export const projectTaskKeys = {
  all: ['pm', 'project-tasks'] as const,
  /** Prefix for every list permutation; used as the broad invalidation key. */
  lists: () => ['pm', 'project-tasks', 'list'] as const,
  list: (projectId: string) =>
    ['pm', 'project-tasks', 'list', projectId] as const,
  detail: (projectTaskId: string) =>
    ['pm', 'project-tasks', 'detail', projectTaskId] as const,
  campaignRollups: (companyId: string) =>
    ['pm', 'project-tasks', 'campaign-rollup', companyId] as const,
  campaignRollup: (companyId: string, campaignId: string) =>
    [...projectTaskKeys.campaignRollups(companyId), campaignId] as const,
}
