import { createClient } from '@/lib/datasource/supabase/server'

/**
 * Bootstraps a server-side Supabase client and verifies there's an
 * authenticated session. All `createServerFn` read handlers call this
 * before running queries so RLS always has a real `auth.uid()` to match
 * against. Throws a plain `Error` because TanStack Start surfaces thrown
 * errors as 500s - callers that need a different status should catch and
 * re-throw a `Response`.
 */
export async function requireAuthedSupabase() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Unauthorized')
  return { supabase, user }
}
