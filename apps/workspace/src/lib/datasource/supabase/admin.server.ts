import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for privileged server-only operations (e.g. JIT
 * linking external IdP subjects). Never import from client components.
 */
export function createServiceRoleClient() {
  const url =
    import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for service-role client.',
    )
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
