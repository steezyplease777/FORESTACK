import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type Vendor = Database['public']['Tables']['erp_vendors']['Row']
export type VendorCategory =
  Database['public']['Tables']['erp_vendor_categories']['Row']
export type VendorWithCategory = Vendor & { category: VendorCategory | null }
