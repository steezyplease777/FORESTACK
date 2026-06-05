// @ts-nocheck
import type { Database } from "@/lib/datasource/supabase/types/database.types";

export type ErpPurchaseOrder =
  Database["public"]["Tables"]["erp_purchase_orders"]["Row"];
export type ErpPurchaseOrderLine =
  Database["public"]["Tables"]["erp_purchase_order_lines"]["Row"];
export type ErpPurchaseOrderLineAllocation =
  Database["public"]["Tables"]["erp_purchase_order_line_allocations"]["Row"];
export type ErpVendor = Database["public"]["Tables"]["erp_vendors"]["Row"];
export type PlmProductVariant =
  Database["public"]["Tables"]["plm_product_variants"]["Row"];
export type PlmProduct = Database["public"]["Tables"]["plm_products"]["Row"];
export type ErpSalesChannel =
  Database["public"]["Tables"]["erp_sales_channels"]["Row"];
export type CrmAllocationOrderLine =
  Database["public"]["Tables"]["crm_allocation_order_lines"]["Row"];
export type CrmAllocationOrder =
  Database["public"]["Tables"]["crm_allocation_order"]["Row"];
export type CrmCompany = Database["public"]["Tables"]["crm_companies"]["Row"];
export type AppUserProfile =
  Database["public"]["Tables"]["app_user_profiles"]["Row"];

export type PurchaseOrderLineListItem = ErpPurchaseOrderLine & {
  allocations: (ErpPurchaseOrderLineAllocation & {
    sales_channel: ErpSalesChannel | null;
  })[];
};

export type PurchaseOrderWithVendor = ErpPurchaseOrder & {
  vendor: ErpVendor | null;
  lines?: PurchaseOrderLineListItem[];
};

export type PurchaseOrderLineWithRelations = ErpPurchaseOrderLine & {
  product_variant: (PlmProductVariant & { product: PlmProduct | null }) | null;
  allocations: (ErpPurchaseOrderLineAllocation & {
    sales_channel: ErpSalesChannel | null;
    crm_allocation_order_lines: (CrmAllocationOrderLine & {
      allocation_order: (CrmAllocationOrder & {
        crm_company: CrmCompany | null;
        created_by_profile: AppUserProfile | null;
      }) | null;
    })[];
  })[];
};

export type PurchaseOrderDetail = ErpPurchaseOrder & {
  vendor: ErpVendor | null;
  lines: PurchaseOrderLineWithRelations[];
};

// ── Mutation input types ────────────────────────────────

export type POAllocationInput = {
  sales_channel_id: string;
  quantity: number;
};

export type POLineInput = {
  product_variant_id: string;
  total_quantity: number;
  quoted_price: number;
  allocations: POAllocationInput[];
};

export type CreatePurchaseOrderInput = {
  company_id: string;
  vendor_id: string;
  purchase_order_number: string;
  purchase_order_date: string;
  internal_code: string;
  total_amount: number;
  status?: string;
  notes?: string;
  carrier?: string;
  tracking_number?: string;
  lines: POLineInput[];
};
