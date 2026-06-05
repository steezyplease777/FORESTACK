import type { WorkOSJwtClaims } from '@/lib/auth/workos/types'

/** Decode JWT payload without signature verification (server already validated via Supabase). */
export function decodeWorkOsJwtClaims(
  accessToken: string,
): WorkOSJwtClaims | null {
  const parts = accessToken.split('.')
  if (parts.length < 2) return null

  try {
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = JSON.parse(atob(padded)) as Record<string, unknown>

    const sub = typeof json.sub === 'string' ? json.sub : null
    const iss = typeof json.iss === 'string' ? json.iss : null
    if (!sub || !iss) return null

    return {
      sub,
      iss,
      email: typeof json.email === 'string' ? json.email : undefined,
      role: typeof json.role === 'string' ? json.role : undefined,
      user_role:
        typeof json.user_role === 'string' ? json.user_role : undefined,
    }
  } catch {
    return null
  }
}
