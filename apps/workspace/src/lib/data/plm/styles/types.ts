import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type PlmStyle = Database['public']['Tables']['plm_styles']['Row']
export type PlmProductCategory =
  Database['public']['Tables']['plm_product_categories']['Row']

export type PlmStyleWithCategory = PlmStyle & {
  category: PlmProductCategory | null
}
