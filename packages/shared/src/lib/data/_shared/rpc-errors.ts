/**
 * Normalizes Supabase RPC / PostgREST error messages into stable
 * `Error` instances for route loaders and server functions.
 *
 * Bundle RPCs (`get_*_bundle`) and other tenant-scoped RPCs share the
 * same auth failure strings — funnel them through one helper instead of
 * duplicating branches per portal.
 */

export function normalizeRpcError(message?: string | null): never {
  const m = message ?? 'Unknown error'
  if (m.includes('not_authenticated')) throw new Error('Unauthorized')
  if (m.includes('company_not_found')) throw new Error('Company not found')
  if (m.includes('not_company_member')) throw new Error('Forbidden')
  throw new Error(m)
}

/** Alias for portal bundle server fns — same auth contract as other RPCs. */
export function normalizeBundleError(message?: string | null): never {
  normalizeRpcError(message)
}
