import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { createClient } from '@/lib/datasource/supabase/server'

export type SessionUser = {
  id: string
  email: string | null
}

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return {
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
    } satisfies SessionUser,
  }
})

export async function requireUser() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) {
    throw redirect({ to: '/login' })
  }
  return { supabase, user: data.user }
}
