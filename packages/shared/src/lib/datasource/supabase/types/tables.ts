// @ts-nocheck
export type { Database, Json } from "./database.types";

import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];

// ─── App / Auth ──────────────────────────────────────────────────────────────

export type AppUserProfile = Tables["app_user_profiles"]["Row"];
export type AppOrganization = Tables["app_organizations"]["Row"];
export type AppOrganizationRole = Tables["app_organization_roles"]["Row"];
export type AppOrganizationUser = Tables["app_organization_users"]["Row"];
export type AppCompany = Tables["app_companies"]["Row"];
export type AppCompanyRole = Tables["app_company_roles"]["Row"];
export type AppCompanyDepartment = Tables["app_company_departments"]["Row"];
export type AppCompanyDepartmentTitle = Tables["app_company_department_titles"]["Row"];
export type AppCompanyUser = Tables["app_company_users"]["Row"];

// ─── Data Sources (formerly Integrations) ────────────────────────────────────

export type AppDataSource = Tables["app_data_sources"]["Row"];
export type AppDataSourceObject = Tables["app_data_source_objects"]["Row"];
export type AppCompanyDataSourceAccount = Tables["app_company_data_source_accounts"]["Row"];
export type AppCompanyDataSourceSubscription = Tables["app_company_data_source_subscriptions"]["Row"];

// ─── PM ──────────────────────────────────────────────────────────────────────

export type PmCampaignCategory = Tables["pm_campaign_categories"]["Row"];
export type PmCampaign = Tables["pm_campaigns"]["Row"];
export type PmCampaignColorway = Tables["pm_campaign_colorways"]["Row"];
export type PmCampaignColor = Tables["pm_campaign_colors"]["Row"];
export type PmCampaignTeam = Tables["pm_campaign_teams"]["Row"];
export type PmCampaignTeamMember = Tables["pm_campaign_team_members"]["Row"];
export type PmProject = Tables["pm_projects"]["Row"];
export type PmProjectType = Tables["pm_project_types"]["Row"];
export type PmProjectStyle = Tables["pm_project_styles"]["Row"];
export type PmProjectTask = Tables["pm_project_tasks"]["Row"];
export type PmTask = Tables["pm_tasks"]["Row"];
export type PmTaskCategory = Tables["pm_task_categories"]["Row"];
export type PmTaskItem = Tables["pm_task_items"]["Row"];

// ─── PLM ─────────────────────────────────────────────────────────────────────

export type PlmStyle = Tables["plm_styles"]["Row"];
export type PlmProduct = Tables["plm_products"]["Row"];
export type PlmProductVariant = Tables["plm_product_variants"]["Row"];
export type PlmProductCategory = Tables["plm_product_categories"]["Row"];
export type PlmProductDepartment = Tables["plm_product_departments"]["Row"];
export type PlmProductType = Tables["plm_product_types"]["Row"];
export type PlmArtwork = Tables["plm_artworks"]["Row"];
export type PlmArtworkCategory = Tables["plm_artwork_categories"]["Row"];
export type PlmArtworkColor = Tables["plm_artwork_colors"]["Row"];
export type PlmArtworkVariant = Tables["plm_artwork_variants"]["Row"];
export type PlmColor = Tables["plm_colors"]["Row"];
export type PlmColorLibrary = Tables["plm_color_libraries"]["Row"];
export type PlmMaterial = Tables["plm_materials"]["Row"];
export type PlmMaterialType = Tables["plm_material_types"]["Row"];
export type PlmSizeRun = Tables["plm_size_runs"]["Row"];
export type PlmSizeRunSize = Tables["plm_size_run_sizes"]["Row"];
export type PlmSizeIndex = Tables["plm_size_index"]["Row"];
export type PlmStyleSourcing = Tables["plm_style_sourcing"]["Row"];

export type StorageProduct = Tables["storage_products"]["Row"];
export type StorageMediaType = Tables["storage_media_types"]["Row"];

// ─── ERP ─────────────────────────────────────────────────────────────────────

export type ErpPurchaseOrder = Tables["erp_purchase_orders"]["Row"];
export type ErpPurchaseOrderLine = Tables["erp_purchase_order_lines"]["Row"];
export type ErpPurchaseOrderLineAllocation = Tables["erp_purchase_order_line_allocations"]["Row"];
export type ErpPurchaseOrderSalesChannel = Tables["erp_purchase_order_sales_channels"]["Row"];
export type ErpSalesChannel = Tables["erp_sales_channels"]["Row"];
export type ErpVendor = Tables["erp_vendors"]["Row"];
export type ErpVendorCategory = Tables["erp_vendor_categories"]["Row"];
export type ErpVendorCategoryAsset = Tables["erp_vendor_category_assets"]["Row"];
export type ErpProductChannel = Tables["erp_product_channels"]["Row"];

// ─── WMS ─────────────────────────────────────────────────────────────────────

export type WmsOrder = Tables["wms_orders"]["Row"];
export type WmsOrderLine = Tables["wms_order_lines"]["Row"];
export type WmsOrderFulfillment = Tables["wms_order_fulfillments"]["Row"];
export type WmsOrderFulfillmentLine = Tables["wms_order_fulfillment_lines"]["Row"];
export type WmsOrderChannel = Tables["wms_order_channels"]["Row"];
export type WmsOrderRouting = Tables["wms_order_routing"]["Row"];
export type WmsWarehouse = Tables["wms_warehouses"]["Row"];
export type WmsInventory = Tables["wms_inventory"]["Row"];
export type WmsCarton = Tables["wms_cartons"]["Row"];

// ─── CRM ─────────────────────────────────────────────────────────────────────

export type CrmCustomer = Tables["crm_customers"]["Row"];
export type CrmCompany = Tables["crm_companies"]["Row"];
export type CrmCompanyLocation = Tables["crm_company_locations"]["Row"];
export type CrmCompanyDocumentType = Tables["crm_company_document_types"]["Row"];
export type CrmCompanyDocument = Tables["crm_company_documents"]["Row"];
export type CrmAddress = Tables["crm_addresses"]["Row"];
export type CrmAllocationOrder = Tables["crm_allocation_order"]["Row"];
export type CrmAllocationOrderLine = Tables["crm_allocation_order_lines"]["Row"];

// ─── Joined / View Types ────────────────────────────────────────────────────

export type PlmProductWithRelations = PlmProduct & {
  plm_styles?: Pick<PlmStyle, "style_number" | "style_name"> | null;
  pm_campaigns?: Pick<PmCampaign, "name"> | null;
  pm_campaign_colorways?: Pick<PmCampaignColorway, "name"> | null;
};

export type WmsOrderWithRelations = WmsOrder & {
  crm_customers?: Pick<CrmCustomer, "name" | "email"> | null;
};

export type PmCampaignWithCategory = PmCampaign & {
  pm_campaign_categories?: Pick<PmCampaignCategory, "name"> | null;
};
