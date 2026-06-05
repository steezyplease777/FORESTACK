// @ts-nocheck
import type { Database } from '@/lib/datasource/supabase/types/database.types'

export type SalesChannel =
  Database['public']['Tables']['erp_sales_channels']['Row']
export type SalesChannelType =
  Database['public']['Enums']['sales_channel_types']
