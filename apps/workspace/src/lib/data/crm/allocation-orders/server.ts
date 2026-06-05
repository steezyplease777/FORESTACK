// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type {
  AllocationOrderWithRelations,
  CreateAllocationOrderInput,
  CreateAllocationOrderLineInput,
} from './types'

const ALLOCATION_ORDER_SELECT = `
  *,
  crm_company_id (*),
  app_user_profiles!crm_allocation_order_created_by_profile_fkey (*),
  crm_allocation_order_lines (
    *,
    erp_purchase_order_line_allocation_id (
      *,
      sales_channel_id (*),
      purchase_order_line_id (
        *,
        product_variant_id (*)
      )
    )
  )
`

function mapAllocationOrder(
  row: Record<string, unknown>,
): AllocationOrderWithRelations {
  const lines = ((row.crm_allocation_order_lines as Record<string, unknown>[]) ?? []).map(
    (line) => {
      const erpAlloc = line.erp_purchase_order_line_allocation_id as
        | Record<string, unknown>
        | null
      return {
        ...line,
        erp_allocation: erpAlloc
          ? {
              ...erpAlloc,
              sales_channel: erpAlloc.sales_channel_id ?? null,
              purchase_order_line: erpAlloc.purchase_order_line_id
                ? {
                    ...(erpAlloc.purchase_order_line_id as Record<string, unknown>),
                    product_variant:
                      (erpAlloc.purchase_order_line_id as Record<string, unknown>)
                        ?.product_variant_id ?? null,
                  }
                : null,
            }
          : null,
      }
    },
  )

  return {
    ...row,
    crm_company: row.crm_company_id ?? null,
    created_by_profile: row.app_user_profiles ?? null,
    lines,
  } as AllocationOrderWithRelations
}

export const getAllocationOrders = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<AllocationOrderWithRelations[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('crm_allocation_order')
      .select(ALLOCATION_ORDER_SELECT)
      .eq('company_id', data.companyId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (rows ?? []).map((row) => mapAllocationOrder(row as Record<string, unknown>))
  })

export const getAllocationOrder = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<AllocationOrderWithRelations | null> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('crm_allocation_order')
      .select(ALLOCATION_ORDER_SELECT)
      .eq('id', data.id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) return null
    return mapAllocationOrder(row as Record<string, unknown>)
  })

export const createAllocationOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      order: CreateAllocationOrderInput
      lines: Omit<CreateAllocationOrderLineInput, 'crm_allocation_order_id'>[]
    }) => data,
  )
  .handler(async ({ data }): Promise<string> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: created, error } = await supabase
      .from('crm_allocation_order')
      .insert({
        company_id: data.order.company_id,
        crm_company_id: data.order.crm_company_id,
        ship_date: data.order.ship_date,
        notes: data.order.notes ?? null,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    const orderId = created.id as string

    if (data.lines.length > 0) {
      const { error: linesError } = await supabase
        .from('crm_allocation_order_lines')
        .insert(
          data.lines.map((l) => ({
            ...l,
            crm_allocation_order_id: orderId,
          })),
        )
      if (linesError) throw new Error(linesError.message)
    }
    return orderId
  })

export const cancelAllocationOrderFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('crm_allocation_order')
      .update({ cancel_date: new Date().toISOString() })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })

export const uncancelAllocationOrderFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('crm_allocation_order')
      .update({ cancel_date: null })
      .eq('id', data.id)
    if (error) throw new Error(error.message)
  })
