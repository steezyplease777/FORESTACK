// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

export type ProfileUpdate = {
  first_name?: string | null
  last_name?: string | null
  profile_picture_url?: string | null
}

export const updateUserProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { orgUserId: string; patch: ProfileUpdate }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase
      .from('app_organization_users')
      .update(data.patch)
      .eq('id', data.orgUserId)
    if (error) throw new Error(error.message)
  })
