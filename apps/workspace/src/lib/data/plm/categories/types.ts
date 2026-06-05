import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type PlmProductCategory =
  Database['public']['Tables']['plm_product_categories']['Row']
