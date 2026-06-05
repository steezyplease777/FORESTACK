import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { PmProjectMember, PmProjectMemberWithUser } from './types'

/**
 * One-shot fetch of a project's member roster with display fields.
 *
 * The nested select walks `pm_project_members → app_company_users →
 * app_organization_users` because the user's real name + avatar live
 * on `app_organization_users`, not `app_company_users`. We flatten
 * that shape client-side so callers get a simple row object.
 */
export const getProjectMembers = createServerFn({ method: 'GET' })
  .inputValidator((data: { projectId: string }) => data)
  .handler(async ({ data }): Promise<PmProjectMemberWithUser[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('pm_project_members')
      .select(
        `id, project_id, company_user_id, company_id, role, created_at,
         company_user:company_user_id (
           id,
           org_user:org_user_id (first_name, last_name, email, profile_picture_url)
         )`,
      )
      .eq('project_id', data.projectId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)

    return (rows ?? []).map((row) => {
      const cu = Array.isArray(row.company_user) ? row.company_user[0] : row.company_user
      const ou = cu && (Array.isArray(cu.org_user) ? cu.org_user[0] : cu.org_user)
      return {
        id: row.id,
        project_id: row.project_id,
        company_user_id: row.company_user_id,
        company_id: row.company_id,
        role: row.role,
        created_at: row.created_at,
        firstName: ou?.first_name ?? null,
        lastName: ou?.last_name ?? null,
        email: ou?.email ?? null,
        profilePictureUrl: ou?.profile_picture_url ?? null,
      }
    })
  })

export const addProjectMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      project_id: string
      company_user_id: string
      company_id: string
      role?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PmProjectMember> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_project_members')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmProjectMember
  })

export const updateProjectMemberRoleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; role: string | null }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_project_members')
      .update({ role: data.role })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const removeProjectMemberFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    // `pm_project_task_assignees` rows referencing this user cascade
    // away via their own FK on `company_user_id`, so removing a member
    // mid-project cleanly unassigns their tasks.
    const { error } = await supabase
      .from('pm_project_members')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })
