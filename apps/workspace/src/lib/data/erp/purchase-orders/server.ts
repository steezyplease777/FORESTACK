// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type {
  CreatePurchaseOrderInput,
  POLineInput,
  PurchaseOrderDetail,
  PurchaseOrderLineListItem,
  PurchaseOrderLineWithRelations,
  PurchaseOrderWithVendor,
} from './types'

async function upsertPOLines(
  supabase: Awaited<ReturnType<typeof requireAuthedSupabase>>['supabase'],
  poId: string,
  lines: POLineInput[],
) {
  const { data: existingLines } = await supabase
    .from('erp_purchase_order_lines')
    .select('id')
    .eq('purchase_order_id', poId)

  if (existingLines && existingLines.length > 0) {
    const lineIds = existingLines.map((l) => l.id)
    await supabase
      .from('erp_purchase_order_line_allocations')
      .delete()
      .in('purchase_order_line_id', lineIds)
    await supabase
      .from('erp_purchase_order_lines')
      .delete()
      .eq('purchase_order_id', poId)
  }

  if (lines.length === 0) return

  const { data: insertedLines, error: linesError } = await supabase
    .from('erp_purchase_order_lines')
    .insert(
      lines.map((l) => ({
        purchase_order_id: poId,
        product_variant_id: l.product_variant_id,
        total_quantity: l.total_quantity,
        quoted_price: l.quoted_price,
        received_quantity: 0,
      })),
    )
    .select('id, product_variant_id')

  if (linesError) throw new Error(linesError.message)
  if (!insertedLines) return

  const allAllocations: {
    purchase_order_line_id: string
    sales_channel_id: string
    quantity: number
  }[] = []

  for (const inserted of insertedLines) {
    const sourceLine = lines.find(
      (l) => l.product_variant_id === inserted.product_variant_id,
    )
    if (!sourceLine?.allocations) continue
    for (const alloc of sourceLine.allocations) {
      if (alloc.quantity > 0) {
        allAllocations.push({
          purchase_order_line_id: inserted.id,
          sales_channel_id: alloc.sales_channel_id,
          quantity: alloc.quantity,
        })
      }
    }
  }

  if (allAllocations.length > 0) {
    const { error: allocError } = await supabase
      .from('erp_purchase_order_line_allocations')
      .insert(allAllocations)
    if (allocError) throw new Error(allocError.message)
  }
}

export const createPurchaseOrderFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreatePurchaseOrderInput) => data)
  .handler(async ({ data }): Promise<string> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: po, error } = await supabase
      .from('erp_purchase_orders')
      .insert({
        company_id: data.company_id,
        vendor_id: data.vendor_id,
        purchase_order_number: data.purchase_order_number,
        purchase_order_date: data.purchase_order_date,
        internal_code: data.internal_code,
        total_amount: data.total_amount,
        status: data.status ?? 'draft',
        notes: data.notes ?? null,
        carrier: data.carrier ?? null,
        tracking_number: data.tracking_number ?? null,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    const poId = po.id as string
    if (data.lines.length > 0) await upsertPOLines(supabase, poId, data.lines)
    return poId
  })

export const updatePurchaseOrderFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { poId: string; patch: Partial<CreatePurchaseOrderInput> }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { poId, patch } = data
    const { lines, company_id, ...header } = patch

    if (Object.keys(header).length > 0) {
      const { error } = await supabase
        .from('erp_purchase_orders')
        .update(header)
        .eq('id', poId)
      if (error) throw new Error(error.message)
    }

    if (lines) await upsertPOLines(supabase, poId, lines)
  })

export const getPurchaseOrders = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<PurchaseOrderWithVendor[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('erp_purchase_orders')
      .select(
        `*, vendor_id (*), erp_purchase_order_lines (*, erp_purchase_order_line_allocations (*, sales_channel_id (*)))`,
      )
      .eq('company_id', data.companyId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (rows ?? []).map((row) => {
      const r = row as Record<string, unknown>
      const vendorObj = r.vendor_id as Record<string, unknown> | null
      const rawLines = (r.erp_purchase_order_lines as Record<string, unknown>[]) ?? []
      const lines: PurchaseOrderLineListItem[] = rawLines.map((l) => {
        const rawAllocs = (l.erp_purchase_order_line_allocations as Record<string, unknown>[]) ?? []
        const allocations = rawAllocs.map((alloc) => {
          const salesChannelObj = alloc.sales_channel_id as Record<string, unknown> | null
          return {
            ...alloc,
            sales_channel: salesChannelObj ?? null,
            sales_channel_id: (salesChannelObj?.id as string) ?? alloc.sales_channel_id,
          }
        })
        return { ...l, allocations } as PurchaseOrderLineListItem
      })
      return {
        ...r,
        vendor: vendorObj ?? null,
        vendor_id: (vendorObj?.id as string) ?? r.vendor_id,
        lines,
      } as PurchaseOrderWithVendor
    })
  })

export const getPurchaseOrder = createServerFn({ method: 'GET' })
  .inputValidator((data: { purchaseOrderId: string }) => data)
  .handler(async ({ data }): Promise<PurchaseOrderDetail | null> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: po, error } = await supabase
      .from('erp_purchase_orders')
      .select(`*, vendor_id (*)`)
      .eq('id', data.purchaseOrderId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!po) return null

    const poRow = po as Record<string, unknown>

    const { data: lines, error: linesError } = await supabase
      .from('erp_purchase_order_lines')
      .select(
        `
        *,
        product_variant_id (
          *,
          product_id (*)
        ),
        erp_purchase_order_line_allocations (
          *,
          sales_channel_id (*),
          crm_allocation_order_lines (
            *,
            crm_allocation_order_id (
              *,
              crm_company_id (*),
              app_user_profiles!crm_allocation_order_created_by_profile_fkey (*)
            )
          )
        )
      `,
      )
      .eq('purchase_order_id', data.purchaseOrderId)
      .order('created_at', { ascending: true })
    if (linesError) throw new Error(linesError.message)

    const mappedLines: PurchaseOrderLineWithRelations[] = (lines ?? []).map((line) => {
      const l = line as Record<string, unknown>
      const variant = l.product_variant_id as Record<string, unknown> | null
      const allocations = (l.erp_purchase_order_line_allocations as Record<string, unknown>[]).map(
        (alloc) => {
          const crmLines = (
            (alloc.crm_allocation_order_lines as Record<string, unknown>[]) ?? []
          ).map((crmLine) => {
            const order = crmLine.crm_allocation_order_id as Record<string, unknown> | null
            return {
              ...crmLine,
              allocation_order: order
                ? {
                    ...order,
                    crm_company: order.crm_company_id ?? null,
                    created_by_profile: order.app_user_profiles ?? null,
                  }
                : null,
            }
          })
          const salesChannelObj = alloc.sales_channel_id as Record<string, unknown> | null
          return {
            ...alloc,
            sales_channel: salesChannelObj ?? null,
            sales_channel_id: (salesChannelObj?.id as string) ?? alloc.sales_channel_id,
            crm_allocation_order_lines: crmLines,
          }
        },
      )
      return {
        ...l,
        product_variant: variant
          ? {
              ...variant,
              product: variant.product_id ?? null,
              product_id:
                (variant.product_id as Record<string, unknown>)?.id ?? variant.product_id,
            }
          : null,
        product_variant_id: (variant?.id as string) ?? l.product_variant_id,
        allocations,
      } as PurchaseOrderLineWithRelations
    })

    const vendorObj = poRow.vendor_id as Record<string, unknown> | null
    return {
      ...poRow,
      vendor: vendorObj ?? null,
      vendor_id: (vendorObj?.id as string) ?? poRow.vendor_id,
      lines: mappedLines,
    } as PurchaseOrderDetail
  })
