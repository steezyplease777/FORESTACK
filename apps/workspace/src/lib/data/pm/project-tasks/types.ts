/**
 * Project-scoped task instances. `pm_project_tasks` is the instance
 * created from a `pm_tasks` template (via the
 * `create_pm_project_task_from_template` RPC), and
 * `pm_project_task_items` are the per-instance sub-steps copied from
 * `pm_task_items` on creation.
 *
 * Assignees are split into two tables (task-level vs item-level) so
 * a "who owns this" answer can live on either the parent task or a
 * specific sub-step. Both must be members of the project (enforced
 * by UI today; could be enforced by trigger later).
 */

/** Narrow template ref embedded in task list/detail responses. */
export type PmProjectTaskTemplateRef = {
  id: string
  name: string
  category_id: string | null
}

export type PmProjectTaskItemStatus = 'open' | 'in_progress' | 'done' | null

export type PmProjectTaskStatus =
  | 'open'
  | 'in_progress'
  | 'blocked'
  | 'done'
  | null

export type PmProjectTask = {
  id: string
  project_id: string
  task_id: string
  company_id: string
  status: string | null
  description: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
}

export type PmProjectTaskItem = {
  id: string
  project_task_id: string
  company_id: string
  template_item_id: string | null
  name: string
  description: string | null
  status: string | null
  due_date: string | null
  sort_order: number
  created_at: string
}

/**
 * Item decorated with its assignee `company_user_id` list. Names /
 * avatars are resolved via the project-member query on the client,
 * so the server response stays narrow.
 */
export type PmProjectTaskItemWithAssignees = PmProjectTaskItem & {
  assignee_company_user_ids: string[]
}

export type PmProjectTaskWithRefs = PmProjectTask & {
  template: PmProjectTaskTemplateRef | null
  assignee_company_user_ids: string[]
  item_count: number
  item_done_count: number
}

export type PmProjectTaskDetail = PmProjectTask & {
  template: PmProjectTaskTemplateRef | null
  assignee_company_user_ids: string[]
  items: PmProjectTaskItemWithAssignees[]
}

/** Bucketed status counts for all tasks across every project in a campaign. */
export type CampaignTaskRollup = {
  total: number
  byStatus: { open: number; in_progress: number; blocked: number; done: number }
}
