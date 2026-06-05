/**
 * Re-exports shared query/RPC helpers so existing portal-bundle imports
 * keep working. Prefer `@/lib/data/_shared/query-policy` and
 * `@/lib/data/_shared/rpc-errors` in new code.
 */
export {
  BUNDLE_GC_TIME,
  BUNDLE_STALE_TIME,
} from '@/lib/data/_shared/query-policy'

export {
  normalizeBundleError,
  normalizeRpcError,
} from '@/lib/data/_shared/rpc-errors'

export type PortalBundle = {
  bundleVersion: number
  /**
   * Placeholder flag for portals that haven't had their RPC filled in
   * yet. True for the scaffolded stubs; real bundles drop it.
   */
  placeholder?: boolean
}
