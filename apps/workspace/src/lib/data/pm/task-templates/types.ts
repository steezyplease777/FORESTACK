/**
 * Task template library types.
 *
 * `pm_tasks` is a company-level template — reusable across projects.
 * `pm_task_items` are the default sub-steps that get copied into
 * `pm_project_task_items` when a template is instantiated on a
 * project. The default assignee on each template item is optional
 * (templates don't know who's on a project yet).
 */
export type PmTaskCategory = {
  id: string
  name: string
  created_at: string
}

export type PmTaskTemplate = {
  id: string
  company_id: string
  category_id: string | null
  name: string
  created_at: string
}

export type PmTaskTemplateItem = {
  id: string
  task_id: string
  company_id: string
  default_assignee_company_user_id: string | null
  name: string
  description: string | null
  sort_order: number
  created_at: string
}

export type PmTaskTemplateWithItems = PmTaskTemplate & {
  category: PmTaskCategory | null
  items: PmTaskTemplateItem[]
}
