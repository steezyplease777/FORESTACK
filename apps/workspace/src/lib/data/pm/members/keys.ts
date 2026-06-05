/**
 * Query keys for `pm_project_members`. Scoped per-project rather than
 * per-company because members are always fetched alongside the project
 * detail page — no need for a cross-project list.
 */
export const projectMemberKeys = {
  all: ['pm', 'project-members'] as const,
  list: (projectId: string) =>
    ['pm', 'project-members', 'list', projectId] as const,
}
