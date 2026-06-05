/**
 * Type-only module. PLM product reads run through `server.ts` via
 * `createServerFn`; this file only exposes row types so pages can annotate
 * without dragging the server bundle into the browser.
 */
import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type PlmProduct = Database['public']['Tables']['plm_products']['Row']
export type PlmProductVariant =
  Database['public']['Tables']['plm_product_variants']['Row']
export type PlmStyle = Database['public']['Tables']['plm_styles']['Row']
export type PlmStyleSourcing =
  Database['public']['Tables']['plm_style_sourcing']['Row']

/**
 * Shape returned by `getProducts` (paginated list). Keeps joins narrow
 * so the list stays fast; the detail endpoint loads the heavier shape.
 */
export type ProductListRow = PlmProduct & {
  style: Pick<PlmStyle, 'id' | 'style_number' | 'style_name' | 'description'> | null
  variants: Pick<PlmProductVariant, 'id' | 'sku' | 'size'>[]
}

/**
 * Shape returned by `getProductDetail`. Bundles everything the detail
 * page needs (style, all variants, linked sourcing with vendor,
 * colorway, campaign) so tabs can render from one cached record.
 */
export type ProductDetail = PlmProduct & {
  style: PlmStyle | null
  variants: PlmProductVariant[]
  sourcing:
    | (PlmStyleSourcing & {
        vendor: { id: string; name: string } | null
      })
    | null
  colorway: {
    id: string
    name: string
    colorway_code: string | null
    campaign_id: string
  } | null
  campaign: { id: string; name: string } | null
}

/** @deprecated use `ProductListRow` or `ProductDetail`. Kept for backwards compat. */
export type ProductWithVariants = ProductListRow
