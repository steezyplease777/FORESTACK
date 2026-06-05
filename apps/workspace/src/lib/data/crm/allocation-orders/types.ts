// @ts-nocheck
import type { Database } from "@/lib/datasource/supabase/types/database.types";

export type CrmAllocationOrder =
  Database["public"]["Tables"]["crm_allocation_order"]["Row"];
export type CrmAllocationOrderLine =
  Database["public"]["Tables"]["crm_allocation_order_lines"]["Row"];
export type CrmCompany = Database["public"]["Tables"]["crm_companies"]["Row"];
export type ErpPurchaseOrderLineAllocation =
  Database["public"]["Tables"]["erp_purchase_order_line_allocations"]["Row"];
export type ErpSalesChannel =
  Database["public"]["Tables"]["erp_sales_channels"]["Row"];
export type ErpPurchaseOrderLine =
  Database["public"]["Tables"]["erp_purchase_order_lines"]["Row"];
export type PlmProductVariant =
  Database["public"]["Tables"]["plm_product_variants"]["Row"];
export type AppUserProfile =
  Database["public"]["Tables"]["app_user_profiles"]["Row"];

export type AllocationOrderWithRelations = CrmAllocationOrder & {
  crm_company: CrmCompany | null;
  created_by_profile: AppUserProfile | null;
  lines: (CrmAllocationOrderLine & {
    erp_allocation: (ErpPurchaseOrderLineAllocation & {
      sales_channel: ErpSalesChannel | null;
      purchase_order_line: (ErpPurchaseOrderLine & {
        product_variant: PlmProductVariant | null;
      }) | null;
    }) | null;
  })[];
};

export type CreateAllocationOrderInput = {
  company_id: string;
  crm_company_id: string;
  ship_date: string;
  notes?: string;
};

export type CreateAllocationOrderLineInput = {
  crm_allocation_order_id: string;
  erp_purchase_order_line_allocation_id: string;
  total_allocated_quantity: number;
};
