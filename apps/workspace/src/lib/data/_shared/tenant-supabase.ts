/**
 * Workspace tenant Supabase client for `createServerFn` handlers.
 *
 * Dynamic-imports `tenant-client.server.ts` so route files that import
 * portal-bundle server fns do not pull `.server.*` modules into the client
 * bundle (TanStack Start import-protection).
 */
export async function getTenantSupabase() {
  const { createTenantClient } = await import(
    '@/lib/datasource/supabase/tenant-client.server'
  )
  return createTenantClient()
}
