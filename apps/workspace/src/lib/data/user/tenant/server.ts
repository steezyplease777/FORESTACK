// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import type { CompanyUser } from './types'

export const getTenantCompanyUser = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<CompanyUser> => {
    const { supabase, user } = await requireAuthedSupabase()
    const email = user.email
    if (!email) throw new Error('No authenticated email found')

    const { data: companyUser, error } = await supabase
      .from('app_company_users')
      .select(
        '*, org_user_id!inner (id, email, first_name, last_name, profile_picture_url)',
      )
      .eq('company_id', data.companyId)
      .eq('org_user_id.email', email)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!companyUser) throw new Error('No company membership found')

    const orgUser = Array.isArray(companyUser.org_user_id)
      ? companyUser.org_user_id[0]
      : companyUser.org_user_id
    if (!orgUser) throw new Error('Invalid org user')

    const { org_user_id: _, ...rest } = companyUser
    return {
      ...rest,
      org_user_id: orgUser.id,
      app_user_profiles: {
        first_name: orgUser.first_name,
        last_name: orgUser.last_name,
        profile_picture_url: orgUser.profile_picture_url,
      },
    } as CompanyUser
  })
