import { createServerFn } from '@tanstack/react-start'

import { createClient } from '@/lib/datasource/supabase/server'

export type OnboardSaasUserInput = {
  orgName: string
  firstName: string
  lastName: string
}

export type OnboardSaasUserResult = {
  organizationId: string
}

/**
 * Atomically creates the caller's first organization, attaches them as
 * `OWNER` in `app_organization_users`, and upserts their `app_user_profiles`
 * row. Delegates to the `public.onboard_saas_user` Postgres function so all
 * three inserts happen in a single transaction.
 */
export const onboardSaasUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: OnboardSaasUserInput) => {
    const orgName = data.orgName?.trim()
    const firstName = data.firstName?.trim()
    const lastName = data.lastName?.trim()
    if (!orgName) throw new Error('Organization name is required')
    if (!firstName) throw new Error('First name is required')
    if (!lastName) throw new Error('Last name is required')
    return { orgName, firstName, lastName }
  })
  .handler(async ({ data }): Promise<OnboardSaasUserResult> => {
    const supabase = createClient()
    const { data: result, error } = await supabase.rpc('onboard_saas_user', {
      p_org_name: data.orgName,
      p_first_name: data.firstName,
      p_last_name: data.lastName,
    })
    if (error) {
      if (error.message.includes('user_already_onboarded')) {
        throw new Error('This account is already attached to an organization.')
      }
      if (error.message.includes('not_authenticated')) {
        throw new Error('You must be signed in to complete onboarding.')
      }
      throw new Error(error.message)
    }
    return { organizationId: result as string }
  })
