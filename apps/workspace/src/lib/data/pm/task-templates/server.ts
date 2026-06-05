import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type {
  PmTaskCategory,
  PmTaskTemplate,
  PmTaskTemplateItem,
  PmTaskTemplateWithItems,
} from './types'

/**
 * Full template library for a company. Kept unpaginated because the
 * template picker on the project page needs to show them all in one
 * searchable dropdown; cap at 500 as a runaway-insert guard.
 */
export const getTaskTemplates = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<PmTaskTemplateWithItems[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('pm_tasks')
      .select(
        `*,
         category:category_id (id, name, created_at),
         items:pm_task_items (
           id, task_id, company_id, default_assignee_company_user_id,
           name, description, sort_order, created_at
         )`,
      )
      .eq('company_id', data.companyId)
      .order('name')
      .limit(500)
    if (error) throw new Error(error.message)
    return (rows ?? []).map((row) => ({
      ...row,
      items: [...(row.items ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
      ),
    })) as unknown as PmTaskTemplateWithItems[]
  })

export const getTaskCategories = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async (): Promise<PmTaskCategory[]> => {
    const { supabase } = await requireAuthedSupabase()
    // Task categories are company-agnostic in the current schema
    // (no company_id column), so this is a global list. Kept behind
    // the company-scoped endpoint shape for forward-compat if the
    // schema ever gains tenancy.
    const { data: rows, error } = await supabase
      .from('pm_task_categories')
      .select('*')
      .order('name')
      .limit(200)
    if (error) throw new Error(error.message)
    return (rows ?? []) as PmTaskCategory[]
  })

export const createTaskTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      name: string
      category_id?: string | null
      items?: Array<{
        name: string
        description?: string | null
        default_assignee_company_user_id?: string | null
      }>
    }) => data,
  )
  .handler(async ({ data }): Promise<PmTaskTemplate> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_tasks')
      .insert({
        company_id: data.company_id,
        name: data.name,
        category_id: data.category_id ?? null,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    // Seed default sub-steps if provided. Done as a second call rather
    // than a stored procedure — the template-create path is low-
    // frequency and the transactional guarantees here don't matter
    // much (no user-visible invariant spans the two tables).
    if (data.items && data.items.length > 0) {
      const itemRows = data.items.map((it, idx) => ({
        task_id: row.id,
        company_id: data.company_id,
        name: it.name,
        description: it.description ?? null,
        default_assignee_company_user_id:
          it.default_assignee_company_user_id ?? null,
        sort_order: idx,
      }))
      const { error: itemErr } = await supabase
        .from('pm_task_items')
        .insert(itemRows)
      if (itemErr) throw new Error(itemErr.message)
    }

    return row as PmTaskTemplate
  })

export const updateTaskTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<Pick<PmTaskTemplate, 'name' | 'category_id'>>
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_tasks')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteTaskTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_tasks')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const createTaskTemplateItemFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      task_id: string
      company_id: string
      name: string
      description?: string | null
      default_assignee_company_user_id?: string | null
      sort_order?: number
    }) => data,
  )
  .handler(async ({ data }): Promise<PmTaskTemplateItem> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_task_items')
      .insert({
        task_id: data.task_id,
        company_id: data.company_id,
        name: data.name,
        description: data.description ?? null,
        default_assignee_company_user_id:
          data.default_assignee_company_user_id ?? null,
        sort_order: data.sort_order ?? 0,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmTaskTemplateItem
  })

export const deleteTaskTemplateItemFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_task_items')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const createTaskCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }): Promise<PmTaskCategory> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_task_categories')
      .insert({ name: data.name })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmTaskCategory
  })
