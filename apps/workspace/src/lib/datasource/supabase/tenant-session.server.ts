import type { User } from '@supabase/supabase-js'

import { decodeWorkOsJwtClaims } from '@/lib/auth/workos/jwt-claims'
import { getWorkOsAccessTokenFromCookies } from '@/lib/auth/workos/session-cookie.server'
import type { WorkOSJwtClaims } from '@/lib/auth/workos/types'

import { createTenantClient } from './tenant-client.server'

export type ResolvedTenantSession = {
  /** Supabase Auth user — null when authenticated via WorkOS Third-Party Auth. */
  supabaseUser: User | null
  workosClaims: WorkOSJwtClaims | null
  isAuthenticated: boolean
}

/**
 * Resolve the current tenant session without calling `auth.getUser()` on an
 * accessToken-configured Supabase client (WorkOS Third-Party Auth).
 */
export async function resolveTenantSession(): Promise<ResolvedTenantSession> {
  const workosToken = getWorkOsAccessTokenFromCookies()
  if (workosToken) {
    const claims = decodeWorkOsJwtClaims(workosToken)
    return {
      supabaseUser: null,
      workosClaims: claims,
      isAuthenticated: claims != null,
    }
  }

  const supabase = createTenantClient()
  const { data } = await supabase.auth.getUser()
  return {
    supabaseUser: data.user,
    workosClaims: null,
    isAuthenticated: data.user != null,
  }
}
