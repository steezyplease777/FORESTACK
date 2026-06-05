import { normalizeRpcError } from '@/lib/data/_shared/rpc-errors'
import { getTenantSupabase } from '@/lib/data/_shared/tenant-supabase'

import type { OrdersDashboardData } from './types'

/**
 * Shared orders-dashboard RPC fetch for server handlers.
 *
 * WorkOS Third-Party Auth JWTs may omit `email`; the Postgres helper
 * `tenant_bundle_caller_email()` resolves the caller via external_subject_id.
 */
export async function fetchOrdersDashboard(
  companySlug: string,
): Promise<OrdersDashboardData> {
  const supabase = await getTenantSupabase()

  const { data: bundle, error } = await supabase.rpc('get_orders_dashboard', {
    p_company_slug: companySlug,
  })

  if (error) normalizeRpcError(error.message)

  return bundle as unknown as OrdersDashboardData
}
