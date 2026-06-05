import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import type {
  PmCampaign,
  PmCampaignCategory,
  PmCampaignDetail,
  PmCampaignWithCategory,
} from './types'

export const getCampaigns = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      companyId: string
      page?: number
      pageSize?: number
      q?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<PaginatedResult<PmCampaignWithCategory>> => {
    const { supabase } = await requireAuthedSupabase()
    const { page, pageSize, q } = normalizePagination(data)
    const { from, to } = computeRange(page, pageSize)

    // `count: 'exact'` piggybacks the total on the same round-trip —
    // one Supabase call returns both the page's rows AND the full
    // count for the pagination footer. Without it we'd need a second
    // call just to render "Page X of Y".
    let query = supabase
      .from('pm_campaigns')
      .select(
        '*, category:category_id (id, company_id, name, description, created_at)',
        { count: 'exact' },
      )
      .eq('company_id', data.companyId)

    if (q) {
      // Search across name + code only. `escapeIlike` neutralizes
      // `%`/`_` in user input so a user typing `%` doesn't suddenly
      // match everything.
      const needle = `%${escapeIlike(q)}%`
      query = query.or(`name.ilike.${needle},campaign_code.ilike.${needle}`)
    }

    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      rows: (rows ?? []) as unknown as PmCampaignWithCategory[],
      total: count ?? 0,
      page,
      pageSize,
    }
  })

export const getCampaign = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; campaignId: string }) => data)
  .handler(async ({ data }): Promise<PmCampaignDetail> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_campaigns')
      .select(
        `*,
         category:category_id (id, company_id, name, description, created_at),
         colorways:pm_campaign_colorways (
           id, campaign_id, company_id, name, colorway_code, created_at
         )`,
      )
      .eq('company_id', data.companyId)
      .eq('id', data.campaignId)
      .single()
    if (error) throw new Error(error.message)
    // `colorways` comes in unordered from PostgREST; stabilize for the UI.
    const detail = row as unknown as PmCampaignDetail
    detail.colorways = [...(detail.colorways ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    )
    return detail
  })

export const getCampaignCategories = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<PmCampaignCategory[]> => {
    const { supabase } = await requireAuthedSupabase()
    // Categories populate a `<Select>` dropdown so we deliberately
    // keep them as an unpaginated list — but cap at 200 as a safety
    // net against a company accidentally creating thousands of them.
    const { data: rows, error } = await supabase
      .from('pm_campaign_categories')
      .select('*')
      .eq('company_id', data.companyId)
      .order('name')
      .limit(200)
    if (error) throw new Error(error.message)
    return (rows ?? []) as PmCampaignCategory[]
  })

export const createCampaignFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      category_id: string
      name: string
      campaign_code?: string | null
      description?: string | null
      start_date?: string | null
      end_date?: string | null
      campaign_image_url?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PmCampaign> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_campaigns')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmCampaign
  })

export const updateCampaignFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<Omit<PmCampaign, 'id' | 'company_id' | 'created_at'>>
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaigns')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteCampaignFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaigns')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const updateCampaignCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<Pick<PmCampaignCategory, 'name' | 'description'>>
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('pm_campaign_categories')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteCampaignCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    // pm_campaigns.category_id is NOT NULL + FK; Postgres will reject
    // deletion if any campaign still references this category. We
    // surface that error as-is so the UI can show "in use by N
    // campaigns" rather than silently failing.
    const { error } = await supabase
      .from('pm_campaign_categories')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const createCampaignCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      name: string
      description?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PmCampaignCategory> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('pm_campaign_categories')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PmCampaignCategory
  })
