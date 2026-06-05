// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { CrmCompanyWithChannel } from './client'

function mapCrmCompany(data: Record<string, unknown>): CrmCompanyWithChannel {
  return { ...data, sales_channel: data.sales_channel_id ?? null } as CrmCompanyWithChannel
}

export const getCrmCompanies = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<CrmCompanyWithChannel[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('crm_companies')
      .select(`*, sales_channel_id (*)`)
      .eq('app_company_id', data.companyId)
      .order('name', { ascending: true })
    if (error) throw new Error(error.message)
    return (rows ?? []).map((r) => mapCrmCompany(r as Record<string, unknown>))
  })

export const getCrmCompany = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<CrmCompanyWithChannel | null> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('crm_companies')
      .select(`*, sales_channel_id (*)`)
      .eq('id', data.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) return null
    return mapCrmCompany(row as Record<string, unknown>)
  })
