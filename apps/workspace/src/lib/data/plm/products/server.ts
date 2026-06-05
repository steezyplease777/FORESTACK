import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import type {
  PlmProduct,
  ProductDetail,
  ProductListRow,
} from './types'

/**
 * Paginated + searchable product list. Mirrors the campaign pattern:
 * one Supabase round-trip returns rows + total via `count: 'exact'`,
 * search covers the fields a user actually types (product name, internal
 * code, style number, style name) using an `or(...)` across two tables
 * via an embedded filter.
 *
 * Search strategy:
 * - Plain columns are matched on `plm_products` via `or(name.ilike,
 *   internal_product_code.ilike)`.
 * - Embedded `style.style_number` / `style.style_name` matches are
 *   handled by calling `.or()` on the embedded resource. PostgREST's
 *   nested-or is brittle, so we keep it simple: the embedded filter
 *   narrows which style rows come back, but because the join is an
 *   inner-esque select we still only return products whose style
 *   matches. If the token misses both product AND style columns, zero
 *   rows come back — which is what the user expects.
 */
export const getProducts = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      companyId: string
      page?: number
      pageSize?: number
      q?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<PaginatedResult<ProductListRow>> => {
    const { supabase } = await requireAuthedSupabase()
    const { page, pageSize, q } = normalizePagination(data)
    const { from, to } = computeRange(page, pageSize)

    let query = supabase
      .from('plm_products')
      .select(
        `*,
         style:style_id (id, style_number, style_name, description),
         variants:plm_product_variants (id, sku, size)`,
        { count: 'exact' },
      )
      .eq('company_id', data.companyId)

    if (q) {
      const needle = `%${escapeIlike(q)}%`
      // Search product columns only. Style-level search is handled by
      // the Styles page; doing both in one query requires a server-side
      // view because PostgREST can't `or` across parent + embedded.
      query = query.or(
        `name.ilike.${needle},internal_product_code.ilike.${needle}`,
      )
    }

    const { data: rows, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      rows: (rows ?? []) as unknown as ProductListRow[],
      total: count ?? 0,
      page,
      pageSize,
    }
  })

export const getProductDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; productId: string }) => data)
  .handler(async ({ data }): Promise<ProductDetail> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('plm_products')
      .select(
        `*,
         style:style_id (*),
         variants:plm_product_variants (*),
         sourcing:sourcing_id (
           *, vendor:vendor_id (id, name)
         ),
         colorway:colorway_id (id, name, colorway_code, campaign_id),
         campaign:campaign_id (id, name)`,
      )
      .eq('company_id', data.companyId)
      .eq('id', data.productId)
      .single()
    if (error) throw new Error(error.message)
    return row as unknown as ProductDetail
  })

export const searchProductsServer = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; query: string }) => data)
  .handler(async ({ data }): Promise<ProductListRow[]> => {
    const { supabase } = await requireAuthedSupabase()
    const needle = `%${escapeIlike(data.query)}%`
    const { data: rows, error } = await supabase
      .from('plm_products')
      .select(
        `*,
         style:style_id (id, style_number, style_name, description),
         variants:plm_product_variants (id, sku, size)`,
      )
      .eq('company_id', data.companyId)
      .or(`name.ilike.${needle},internal_product_code.ilike.${needle}`)
      .order('name')
      .limit(25)
    if (error) throw new Error(error.message)
    return (rows ?? []) as unknown as ProductListRow[]
  })

export const createProductFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      name: string
      // style_id is now nullable at the DB level — products created
      // without going through the "new style" wizard path can skip it
      // and add one later from the detail page.
      style_id?: string | null
      colorway_id: string
      campaign_id: string
      sourcing_id?: string | null
      internal_product_code?: string | null
      msrp?: number | null
      retail_description?: string | null
      seo_description?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PlmProduct> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('plm_products')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PlmProduct
  })

export const updateProductFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      patch: Partial<Omit<PlmProduct, 'id' | 'company_id' | 'created_at'>>
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('plm_products')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const deleteProductFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    // Variants FK on products is `on delete cascade` in most codebases
    // of this shape; if not, Postgres will reject and the UI surfaces
    // the error. Either way we avoid silently orphaning variants.
    const { error } = await supabase
      .from('plm_products')
      .delete()
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })
