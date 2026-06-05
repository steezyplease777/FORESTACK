import { createMiddleware, createStart } from '@tanstack/react-start'

import { createTenantClient } from '@/lib/datasource/supabase/tenant-client.server'

const supabaseSessionRefresh = createMiddleware().server(async ({ next }) => {
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
