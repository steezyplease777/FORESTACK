import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import type {
  PmProject,
  PmProjectDetail,
  PmProjectType,
  PmProjectWithRefs,
} from './types'
import type { PmProjectScope } from './keys'

/**
 * Paginated + searchable projects feed.
 *
 * `scope` lets the same endpoint service three call sites:
 *   - The Projects tab (`scope: 'standalone'`) shows only projects
 *     with no campaign link so the tab isn't polluted by per-campaign
 *     rows.
 *   - A campaign detail page (`scope: { campaignId }`) lists only the
 *     projects belonging to that campaign.
 *   - Admin / bundle views can pass `scope: 'all'` (default) to
 *     page through every project.
 *
 * Uses `count: 'exact'` so rows + total come back in one round trip,
 * matching the pagination contract the campaigns list already uses.
 */
export const getProjects = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      companyId: string
      scope?: PmProjectScope
      page?: number
      pageSize?: number
      q?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<PaginatedResult<PmProjectWithRefs>> => {
    const { supabase } = await requireAuthedSupabase()
    const { page, pageSize, q } = normalizePagination(data)
    const { from, to } = computeRange(page, pageSize)

    let query = supabase
      .from('pm_projects')
      .select(
        `*,
         campaign:campaign_id (id, name, campaign_code),
         type:type_id (id, company_id, name, description, created_at),
         tasks:pm_project_tasks (id, status),
         members:pm_project_members (count)`,
        { count: 'exact' },
      )
      .eq('company_id', data.companyId)

    const scope = data.scope ?? 'all'
    if (scope === 'standalone') {
      query = query.is('campaign_id', null)
    } else if (typeof scope === 'object' && scope.campaignId) {
      query = query.eq('campaign_id', scope.campaignId)
    }

    if (q) {
      const needle = `%${escapeIlike(q)}%`
      // Search across name + description. Status is too free-form to
      // be useful here; campaign-code search lives on the campaigns
      // page where it's primary.
      query = query.or(`name.ilike.${needle},description.ilike.${needle}`)
    }

    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    // PostgREST returns embedded `count` selects as `[{ count: N }]`;
    // flatten to a scalar for the client-facing type.
    const normalized = (rows ?? []).map((row: any) => {
      const membersRaw = row.members
      const memberCount = Array.isArray(membersRaw)
        ? Number(membersRaw[0]?.count ?? 0)
        : Number(membersRaw?.count ?? 0)
      const { members: _m, ...rest } = row
      return { ...rest, member_count: memberCount }
    })

    return {
      rows: normalized as unknown as PmProjectWithRefs[],
      total: count ?? 0,
      page,
      pageSize,
    }
  })

export const getProject = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; projectId: string }) => data)
  .handler(async ({ data }): Promise<PmProjectDetail> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_projects')
      .select(
        `*,
         campaign:campaign_id (id, name, campaign_code),
         type:type_id (id, company_id, name, description, created_at)`,
      )
      .eq('company_id', data.companyId)
      .eq('id', data.projectId)
      .single()
    if (error) throw new Error(error.message)
    return row as unknown as PmProjectDetail
  })

export const getProjectTypes = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<PmProjectType[]> => {
    const { supabase } = await requireAuthedSupabase()
    // Types populate the form's `<Select>` dropdown. Keep unpaginated
    // but capped at 200 as a safety net, same pattern as campaign
    // categories.
    const { data: rows, error } = await supabase
      .from('pm_project_types')
      .select('*')
      .eq('company_id', data.companyId)
      .order('name')
      .limit(200)
    if (error) throw new Error(error.message)
    return (rows ?? []) as PmProjectType[]
  })

export const createProjectFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      type_id: string
      name: string
      /** `null` produces a standalone project; otherwise campaign-scoped. */
      campaign_id?: string | null
      description?: string | null
      start_date?: string | null
      end_date?: string | null
      status?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PmProject> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_projects')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmProject
  })

export const updateProjectFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<Omit<PmProject, 'id' | 'company_id' | 'created_at'>>
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_projects')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteProjectFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_projects')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const createProjectTypeFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      name: string
      description?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PmProjectType> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_project_types')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmProjectType
  })
