import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { PlmProductCategory } from './types'

export const getPlmProductCategories = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<PlmProductCategory[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('plm_product_categories')
      .select('*')
      .eq('company_id', data.companyId)
      .order('name')
      .limit(500)
    if (error) throw new Error(error.message)
    return (rows ?? []) as PlmProductCategory[]
  })
