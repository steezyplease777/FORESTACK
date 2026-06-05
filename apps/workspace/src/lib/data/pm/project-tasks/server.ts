import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type {
  PmProjectTask,
  PmProjectTaskDetail,
  PmProjectTaskItem,
  PmProjectTaskWithRefs,
} from './types'

/**
 * All tasks for a project with template ref + assignee ids + sub-item
 * counts for the list-row progress indicator.
 *
 * The assignee id list comes back as rows from the join table; we
 * flatten it client-side to `string[]`. Item counts are derived from
 * a separate small select because PostgREST can't aggregate inside a
 * nested select.
 */
export const getProjectTasks = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }): Promise<PmProjectTaskWithRefs[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('pm_project_tasks')
      .select(
        `id, project_id, task_id, company_id, status, description, due_date,
         created_by, created_at,
         template:task_id (id, name, category_id),
         assignees:pm_project_task_assignees (company_user_id),
         items:pm_project_task_items (id, status)`,
      )
      .eq('project_id', data.projectId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)

    return (rows ?? []).map((row) => {
      const assignees = (row.assignees ?? []) as Array<{ company_user_id: string }>
      const items = (row.items ?? []) as Array<{ id: string; status: string | null }>
      return {
        id: row.id,
        project_id: row.project_id,
        task_id: row.task_id,
        company_id: row.company_id,
        status: row.status,
        description: row.description,
        due_date: row.due_date,
        created_by: row.created_by,
        created_at: row.created_at,
        template: Array.isArray(row.template) ? row.template[0] : row.template,
        assignee_company_user_ids: assignees.map((a) => a.company_user_id),
        item_count: items.length,
        item_done_count: items.filter((it) => it.status === 'done').length,
      }
    }) as PmProjectTaskWithRefs[]
  })

export const getProjectTask = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectTaskId: string }) => data)
  .handler(async ({ data }): Promise<PmProjectTaskDetail> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_project_tasks')
      .select(
        `id, project_id, task_id, company_id, status, description, due_date,
         created_by, created_at,
         template:task_id (id, name, category_id),
         assignees:pm_project_task_assignees (company_user_id),
         items:pm_project_task_items (
           id, project_task_id, company_id, template_item_id,
           name, description, status, due_date, sort_order, created_at,
           assignees:pm_project_task_item_assignees (company_user_id)
         )`,
      )
      .eq('id', data.projectTaskId)
      .single()
    if (error) throw new Error(error.message)

    const assignees = (row.assignees ?? []) as Array<{ company_user_id: string }>
    const items = ((row.items ?? []) as any[])
      .map((it) => ({
        ...it,
        assignee_company_user_ids: (it.assignees ?? []).map(
          (a: { company_user_id: string }) => a.company_user_id,
        ),
      }))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const template = Array.isArray(row.template) ? row.template[0] : row.template

    return {
      id: row.id,
      project_id: row.project_id,
      task_id: row.task_id,
      company_id: row.company_id,
      status: row.status,
      description: row.description,
      due_date: row.due_date,
      created_by: row.created_by,
      created_at: row.created_at,
      template: template ?? null,
      assignee_company_user_ids: assignees.map((a) => a.company_user_id),
      items,
    } as PmProjectTaskDetail
  })

/**
 * Instantiate a template onto a project via the RPC, which copies
 * template items into `pm_project_task_items` in the same transaction.
 * Returns the new `pm_project_tasks.id`.
 */
export const createProjectTaskFromTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      project_id: string
      template_id: string
      company_id: string
      created_by?: string | null
      status?: string | null
      description?: string | null
      due_date?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<string> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: id, error } = await supabase.rpc(
      'create_pm_project_task_from_template',
      {
        p_project_id: data.project_id,
        p_template_id: data.template_id,
        p_company_id: data.company_id,
        p_created_by: data.created_by ?? null,
        p_status: data.status ?? null,
        p_due_date: data.due_date ?? null,
        p_description: data.description ?? null,
      },
    )
    if (error) throw new Error(error.message)
    return id as string
  })

export const updateProjectTaskFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<
        Pick<PmProjectTask, 'status' | 'description' | 'due_date'>
      >
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_project_tasks')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteProjectTaskFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_project_tasks')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

/**
 * Replace a task's assignee set wholesale. Simpler than add/remove
 * round-trips and keeps the UI's multi-select pattern honest: the
 * picker is the source of truth, the DB gets rewritten to match.
 */
export const setProjectTaskAssigneesFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      project_task_id: string
      company_id: string
      company_user_ids: string[]
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    // Delete existing, then insert the new set. Acceptable over a
    // diff-based approach because assignee sets are tiny (1-10 rows)
    // and the clobber is idempotent under concurrent requests.
    const { error: delErr } = await supabase
      .from('pm_project_task_assignees')
      .delete()
      .eq('project_task_id', data.project_task_id)
    if (delErr) throw new Error(delErr.message)

    if (data.company_user_ids.length === 0) return
    const rows = data.company_user_ids.map((company_user_id) => ({
      project_task_id: data.project_task_id,
      company_user_id,
      company_id: data.company_id,
    }))
    const { error: insErr } = await supabase
      .from('pm_project_task_assignees')
      .insert(rows)
    if (insErr) throw new Error(insErr.message)
  })

export const setProjectTaskItemAssigneesFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      project_task_item_id: string
      company_id: string
      company_user_ids: string[]
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error: delErr } = await supabase
      .from('pm_project_task_item_assignees')
      .delete()
      .eq('project_task_item_id', data.project_task_item_id)
    if (delErr) throw new Error(delErr.message)
    if (data.company_user_ids.length === 0) return
    const rows = data.company_user_ids.map((company_user_id) => ({
      project_task_item_id: data.project_task_item_id,
      company_user_id,
      company_id: data.company_id,
    }))
    const { error: insErr } = await supabase
      .from('pm_project_task_item_assignees')
      .insert(rows)
    if (insErr) throw new Error(insErr.message)
  })

export const updateProjectTaskItemFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<
        Pick<PmProjectTaskItem, 'name' | 'description' | 'status' | 'due_date'>
      >
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_project_task_items')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const createProjectTaskItemFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      project_task_id: string
      company_id: string
      name: string
      description?: string | null
      sort_order?: number
    }) => data,
  )
  .handler(async ({ data }): Promise<PmProjectTaskItem> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_project_task_items')
      .insert({
        project_task_id: data.project_task_id,
        company_id: data.company_id,
        name: data.name,
        description: data.description ?? null,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmProjectTaskItem
  })

/**
 * Fast-path rollup for the Campaign dashboard: statuses of every task
 * across every project linked to a campaign. One round-trip instead
 * of "fetch N projects → fetch N task lists". We only select `status`
 * because the UI just needs bucket counts.
 */
export const getCampaignTaskStatuses = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { companyId: string; campaignId: string }) => data,
  )
  .handler(async ({ data }): Promise<Array<{ status: string | null }>> => {
    const { supabase } = await requireAuthedSupabase()
    // Nested select walks the FK chain `pm_project_tasks → pm_projects`
    // and filters on `pm_projects.campaign_id` — PostgREST emits this
    // as a join so it stays in a single query. `!inner` makes the
    // project row required, which effectively filters out tasks on
    // projects that have no campaign (shouldn't happen, but defensive).
    const { data: rows, error } = await supabase
      .from('pm_project_tasks')
      .select('status, project:project_id!inner (id, campaign_id)')
      .eq('company_id', data.companyId)
      .eq('project.campaign_id', data.campaignId)
    if (error) throw new Error(error.message)
    return (rows ?? []).map((r: any) => ({ status: r.status ?? null }))
  })

export const deleteProjectTaskItemFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_project_task_items')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })
