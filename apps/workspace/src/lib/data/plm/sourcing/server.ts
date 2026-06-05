import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import type { PlmStyleSourcing, SourcingWithRefs } from './types'

/**
 * Paginated + searchable sourcing list. Search matches HS tariff code
 * and COG text — the two fields a buyer is most likely to type. Style
 * number / vendor name search would require server-side views or a
 * pgvector/full-text setup; punted for now.
 */
export const getSourcing = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      companyId: string
      page?: number
      pageSize?: number
      q?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<PaginatedResult<SourcingWithRefs>> => {
    const { supabase } = await requireAuthedSupabase()
    const { page, pageSize, q } = normalizePagination(data)
    const { from, to } = computeRange(page, pageSize)

    let query = supabase
      .from('plm_style_sourcing')
      .select(
        `*,
         style:style_id (id, style_number, style_name, description),
         vendor:vendor_id (id, name)`,
        { count: 'exact' },
      )
      .eq('company_id', data.companyId)

    if (q) {
      const needle = `%${escapeIlike(q)}%`
      // Cog is numeric — cast via `::text` would need an RPC, skip.
      query = query.or(`hs_tariff_code.ilike.${needle}`)
    }

    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      rows: (rows ?? []) as unknown as SourcingWithRefs[],
      total: count ?? 0,
      page,
      pageSize,
    }
  })

export const getSourcingDetail = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { companyId: string; sourcingId: string }) => data,
  )
  .handler(async ({ data }): Promise<SourcingWithRefs> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('plm_style_sourcing')
      .select(
        `*,
         style:style_id (id, style_number, style_name, description),
         vendor:vendor_id (id, name)`,
      )
      .eq('company_id', data.companyId)
      .eq('id', data.sourcingId)
      .single()
    if (error) throw new Error(error.message)
    return row as unknown as SourcingWithRefs
  })

/**
 * All sourcing rows for a specific style. Used by the Product detail
 * page's Sourcing tab so the user can swap which sourcing option the
 * product points at.
 */
export const getSourcingByStyle = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; styleId: string }) => data)
  .handler(async ({ data }): Promise<SourcingWithRefs[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('plm_style_sourcing')
      .select(
        `*,
         style:style_id (id, style_number, style_name, description),
         vendor:vendor_id (id, name)`,
      )
      .eq('company_id', data.companyId)
      .eq('style_id', data.styleId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (rows ?? []) as unknown as SourcingWithRefs[]
  })

export const createSourcingFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      style_id: string
      vendor_id: string
      cog?: number | null
      hs_tariff_code?: string | null
      weight?: number | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PlmStyleSourcing> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('plm_style_sourcing')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PlmStyleSourcing
  })

export const updateSourcingFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<
        Omit<PlmStyleSourcing, 'id' | 'company_id' | 'created_at'>
      >
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('plm_style_sourcing')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

/**
 * Delete a sourcing row. Postgres will reject the delete if any
 * `plm_products.sourcing_id` still references this row (confdeltype
 * = 'a'); we surface the error so the UI can tell the user to
 * unlink products first instead of silently cascading.
 */
export const deleteSourcingFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('plm_style_sourcing')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })
