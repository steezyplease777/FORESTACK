import { createMiddleware, createStart } from '@tanstack/react-start'

import { getWorkOsAccessTokenFromCookies } from '@/lib/auth/workos/session-cookie.server'
import { createTenantClient } from '@/lib/datasource/supabase/tenant-client.server'

const supabaseSessionRefresh = createMiddleware().server(async ({ next }) => {
  // WorkOS Third-Party Auth uses accessToken clients — auth.getUser() is unavailable.
  if (getWorkOsAccessTokenFromCookies()) {
    return next()
  }

  try {
    const supabase = createTenantClient()
    await supabase.auth.getUser()
  } catch {
  }
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [supabaseSessionRefresh],
}))
