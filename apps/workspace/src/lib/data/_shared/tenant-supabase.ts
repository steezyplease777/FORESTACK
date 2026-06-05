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

/**
 * Tenant-scoped Supabase client plus a session check that works with WorkOS
 * Third-Party Auth (no `auth.getUser()` on an accessToken-configured client).
 */
export async function requireTenantSupabase() {
  const { resolveTenantSession } = await import(
    '@/lib/datasource/supabase/tenant-session.server'
  )
  const session = await resolveTenantSession()
  if (!session.isAuthenticated) {
    throw new Error('Unauthorized')
  }
  const supabase = await getTenantSupabase()
  return { supabase, session }
}
