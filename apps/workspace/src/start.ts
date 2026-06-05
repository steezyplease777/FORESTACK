import { createMiddleware, createStart } from '@tanstack/react-start'

import { createClient } from '@/lib/datasource/supabase/server'

const supabaseSessionRefresh = createMiddleware().server(async ({ next }) => {
  try {
    const supabase = createClient()
    await supabase.auth.getUser()
  } catch {
  }
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [supabaseSessionRefresh],
}))
