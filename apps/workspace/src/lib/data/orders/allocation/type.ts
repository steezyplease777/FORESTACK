// @ts-nocheck
import { Database } from "@/lib/datasource/supabase/types/database.types";
export type ErpPurchaseOrderLineAllocation = Database["public"]["Tables"]["erp_purchase_order_line_allocations"]["Row"];
export type ErpPurchaseOrderLine = Database["public"]["Tables"]["erp_purchase_order_lines"]["Row"];
export type ErpPurchaseOrder = Database["public"]["Tables"]["erp_purchase_orders"]["Row"];
export type ErpSalesChannel = Database["public"]["Tables"]["erp_sales_channels"]["Row"];
export type ErpVendor = Database["public"]["Tables"]["erp_vendors"]["Row"];
export type PlmProductVariant = Database["public"]["Tables"]["plm_product_variants"]["Row"];
export type CrmAllocationOrderLine = Database["public"]["Tables"]["crm_allocation_order_lines"]["Row"];
export type CrmCompany = Database["public"]["Tables"]["crm_companies"]["Row"];
export type CrmAllocationOrder = Database["public"]["Tables"]["crm_allocation_order"]["Row"];


// NOTE: `erp_sales_channel` is now resolved via the
// `erp_purchase_order_sales_channels` join table - see
// `mapAllocationResponse` in ./server.ts. The join-row itself is
// exposed as `erp_purchase_order_sales_channel` for callers that need
// PO-specific sales-channel metadata (notes, etc.).
//
// The CRM allocation-order link chain was removed from the database;
// `crm_allocation_order_line` can no longer be traversed up to an
// order/company and will be `null` for any row.
export type allocationOrder = ErpPurchaseOrderLineAllocation & {
    erp_purchase_order_line: ErpPurchaseOrderLine & {
        plm_product_variant: PlmProductVariant;
        allocation_lines: ErpPurchaseOrderLineAllocation & {
         crm_allocation_order_line: CrmAllocationOrderLine | null;
        };
    };
    erp_sales_channel: ErpSalesChannel | null;
    erp_purchase_order_sales_channel: Record<string, unknown> | null;
    erp_vendor: ErpVendor | null;
  };