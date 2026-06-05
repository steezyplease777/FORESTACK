import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { Vendor, VendorCategory, VendorWithCategory } from './types'

export const getVendors = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<VendorWithCategory[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('erp_vendors')
      .select('*, category_id (*)')
      .eq('company_id', data.companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (rows ?? []).map((r) => {
      const row = r as Record<string, unknown>
      return { ...row, category: row.category_id ?? null } as VendorWithCategory
    })
  })

export const getVendorCategories = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<VendorCategory[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('erp_vendor_categories')
      .select('*')
      .eq('company_id', data.companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (rows ?? []) as VendorCategory[]
  })

export const createVendorFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      name: string
      category_id: string | null
      description?: string | null
      contact_name?: string | null
      contact_email?: string | null
      contact_phone?: string | null
      website_url?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<Vendor> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('erp_vendors')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as Vendor
  })

export const updateVendorFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; patch: Partial<Omit<Vendor, 'id' | 'created_at'>> }) =>
      data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('erp_vendors')
      .update(data.patch)
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const createVendorCategoryFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      company_id: string
      name: string
      description?: string | null
    }) => data,
  )
  .handler(async ({ data }): Promise<VendorCategory> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('erp_vendor_categories')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as VendorCategory
  })
