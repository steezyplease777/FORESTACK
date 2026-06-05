import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { getWorkOsAccessTokenFromCookies } from '@/lib/auth/workos/session-cookie.server'
import { createClient as createSessionClient } from '@/lib/datasource/supabase/server'

/**
 * Server Supabase client for workspace tenant routes.
 *
 * Uses the WorkOS access token from an httpOnly cookie when present (Third-Party
 * Auth); otherwise falls back to the standard Supabase Auth session cookies.
 */
export function createTenantClient() {
  const workosToken = getWorkOsAccessTokenFromCookies()
  if (!workosToken) {
    return createSessionClient()
  }

  const url =
    import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment.',
    )
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    accessToken: async () => workosToken,
  })
}
