import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type PlmStyleSourcing =
  Database['public']['Tables']['plm_style_sourcing']['Row']

/**
 * List/detail view. Sourcing without the style+vendor names is
 * basically useless in the UI (you'd just see IDs) so every endpoint
 * returns the joined shape.
 */
export type SourcingWithRefs = PlmStyleSourcing & {
  style: {
    id: string
    style_number: string
    style_name: string | null
    description: string | null
  } | null
  vendor: { id: string; name: string } | null
}

/** Same shape, also used by the product detail embed. */
export type SourcingRow = SourcingWithRefs
