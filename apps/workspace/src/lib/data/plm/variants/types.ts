import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type PlmProductVariant =
  Database['public']['Tables']['plm_product_variants']['Row']

/**
 * Variant row with enough product + style context to be readable on
 * its own page. We don't pull every product column — just what's
 * shown in the table — to keep the payload tight.
 */
export type VariantWithRefs = PlmProductVariant & {
  product: {
    id: string
    name: string
    internal_product_code: string | null
    style: {
      id: string
      style_number: string
      style_name: string | null
    } | null
  } | null
}
