import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import type { VariantWithRefs } from './types'

/**
 * Paginated + searchable variant list. Search matches SKU and UPC —
 * the two identifiers a user actually types when looking for a
 * specific variant. Product name search would need a cross-table
 * `or` which PostgREST can't express cleanly; the Products page
 * covers that case.
 */
export const getVariants = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      companyId: string
      page?: number
      pageSize?: number
      q?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<PaginatedResult<VariantWithRefs>> => {
    const { supabase } = await requireAuthedSupabase()
    const { page, pageSize, q } = normalizePagination(data)
    const { from, to } = computeRange(page, pageSize)

    let query = supabase
      .from('plm_product_variants')
      .select(
        `*,
         product:product_id (
           id, name, internal_product_code,
           style:style_id (id, style_number, style_name)
         )`,
        { count: 'exact' },
      )
      .eq('company_id', data.companyId)

    if (q) {
      const needle = `%${escapeIlike(q)}%`
      query = query.or(`sku.ilike.${needle},upc.ilike.${needle}`)
    }

    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      rows: (rows ?? []) as unknown as VariantWithRefs[],
      total: count ?? 0,
      page,
      pageSize,
    }
  })
