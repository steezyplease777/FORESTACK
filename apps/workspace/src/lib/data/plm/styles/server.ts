import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { PlmStyle, PlmStyleWithCategory } from './types'

/**
 * Unpaginated list of styles for dropdown use. Capped at 500 rows as
 * a safety net — we don't want a runaway tenant to ship 50k rows to
 * the browser. A proper search should replace this once catalogs get
 * large enough to hit the cap.
 */
export const getStyles = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<PlmStyleWithCategory[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('plm_styles')
      .select('*, category:category_id (*)')
      .eq('company_id', data.companyId)
      .order('style_number', { ascending: true })
      .limit(500)
    if (error) throw new Error(error.message)
    return (rows ?? []) as unknown as PlmStyleWithCategory[]
  })

export const getStyleDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; styleId: string }) => data)
  .handler(async ({ data }): Promise<PlmStyleWithCategory | null> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('plm_styles')
      .select('*, category:category_id (*)')
      .eq('company_id', data.companyId)
      .eq('id', data.styleId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return (row ?? null) as unknown as PlmStyleWithCategory | null
  })

/**
 * Create a style. Only `company_id` and `style_number` are required at
 * the DB level — callers can defer the rest (category, size run, etc.)
 * and fill them in from the style detail page later.
 */
export const createStyleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      style_number: string
      style_name?: string | null
      description?: string | null
      working_name?: string | null
      category_id?: string | null
      gender?: PlmStyle['gender']
      size_run_id?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<PlmStyle> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('plm_styles')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as PlmStyle
  })
