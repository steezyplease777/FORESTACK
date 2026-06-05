// @ts-nocheck
/**
 * Type-only module. All CRM company reads run through `server.ts` via
 * `createServerFn`; this file only exposes the shared row types so pages
 * and other modules can annotate without pulling the server bundle into
 * the browser.
 */
import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type ErpSalesChannel =
  Database['public']['Tables']['erp_sales_channels']['Row']

export type CrmCompanyWithChannel =
  Database['public']['Tables']['crm_companies']['Row'] & {
    sales_channel: ErpSalesChannel | null
  }
