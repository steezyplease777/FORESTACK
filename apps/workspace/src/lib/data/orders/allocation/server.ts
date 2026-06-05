// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { allocationOrder } from './type'

// The FK from `erp_purchase_order_line_allocations.sales_channel_id`
// resolves to the join table `erp_purchase_order_sales_channels`
// (NOT directly to `erp_sales_channels`). To reach the real sales
// channel we hop one more level through that join table's own
// `sales_channel_id` FK. The outer `sales_channel_id (...)` expansion
// therefore wraps a nested `sales_channel_id (*)` that PostgREST
// resolves as `erp_sales_channels`.
//
// `category_id` previously lived on the sales channel table but was
// dropped - do not reintroduce it here.
//
// `crm_allocation_order_lines` used to carry a `crm_allocation_order_id`
// FK that chained up to `crm_allocation_order`/`crm_companies`; that
// column no longer exists, so we only pull the raw line rows and let
// callers degrade gracefully when CRM context is unavailable.
const ALLOCATION_SELECT = `
  *,
  purchase_order_line_id (
    *,
    product_variant_id (*),
    purchase_order_id (
      vendor_id (*)
    )
  ),
  sales_channel_id (
    *,
    sales_channel_id (*)
  ),
  crm_allocation_order_lines (
    *
  )
`

function mapAllocationResponse(data: Record<string, unknown>): allocationOrder {
  const line = data.purchase_order_line_id as Record<string, unknown>
  const purchaseOrderSalesChannel = data.sales_channel_id as
    | Record<string, unknown>
    | undefined
  // `erp_purchase_order_sales_channels.sales_channel_id` is the actual
  // `erp_sales_channels` row; keep a handle to the join row too in case
  // callers ever need the PO-specific notes/metadata.
  const salesChannel =
    (purchaseOrderSalesChannel?.sales_channel_id as Record<string, unknown> | undefined) ??
    undefined
  const purchaseOrder = line?.purchase_order_id as Record<string, unknown> | undefined
  const allocationOrderLines = data.crm_allocation_order_lines
  const firstLine = Array.isArray(allocationOrderLines)
    ? allocationOrderLines[0]
    : allocationOrderLines

  return {
    ...data,
    erp_purchase_order_line: {
      ...line,
      plm_product_variant: line?.product_variant_id,
      allocation_lines: {
        ...data,
        crm_allocation_order_line: firstLine ?? null,
      },
    },
    erp_sales_channel: salesChannel ?? null,
    erp_purchase_order_sales_channel: purchaseOrderSalesChannel ?? null,
    erp_vendor: purchaseOrder?.vendor_id ?? null,
  } as allocationOrder
}

export const getAllocationOrdersList = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<allocationOrder[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('erp_purchase_order_line_allocations')
      .select(ALLOCATION_SELECT)
      .eq('purchase_order_line_id.purchase_order_id.company_id', data.companyId)
    if (error) throw new Error(error.message)
    if (!rows || rows.length === 0) return []
    return rows.map((row) => mapAllocationResponse(row as Record<string, unknown>))
  })

export const getAllocationOrderById = createServerFn({ method: 'GET' })
  .inputValidator((data: { allocationOrderId: string }) => data)
  .handler(async ({ data }): Promise<allocationOrder | null> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: row, error } = await supabase
      .from('erp_purchase_order_line_allocations')
      .select(ALLOCATION_SELECT)
      .eq('id', data.allocationOrderId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!row) return null
    return mapAllocationResponse(row as Record<string, unknown>)
  })
