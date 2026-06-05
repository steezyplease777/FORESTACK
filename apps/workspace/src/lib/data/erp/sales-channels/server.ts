// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { SalesChannel, SalesChannelType } from './client'

export const getSalesChannels = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SalesChannel[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data, error } = await supabase
      .from('erp_sales_channels')
      .select('*')
      .order('name')
    if (error) throw new Error(error.message)
    return (data ?? []) as SalesChannel[]
  },
)

export const createSalesChannelFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      name: string
      channel_code: string
      sales_channel_type: SalesChannelType
      company_id?: string
    }) => data,
  )
  .handler(async ({ data }): Promise<SalesChannel> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('erp_sales_channels')
      .insert(data)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return row as SalesChannel
  })

export const updateSalesChannelFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      id: string
      name?: string
      channel_code?: string
      sales_channel_type?: SalesChannelType
    }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { id, ...patch } = data
    const { error } = await supabase
      .from('erp_sales_channels')
      .update(patch)
      .eq('id', id)
    if (error) throw new Error(error.message)
  })
