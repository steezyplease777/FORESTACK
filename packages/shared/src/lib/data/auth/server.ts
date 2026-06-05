// @ts-nocheck
/**
 * Server-only auth functions. Wrapping Supabase auth calls in `createServerFn`
 * keeps `@supabase/supabase-js` out of the client bundle: the session cookies
 * are set by the server via `@supabase/ssr` using our `getCookies`/`setCookie`
 * adapter in `@/lib/datasource/supabase/server`.
 */
import { createServerFn } from '@tanstack/react-start'

import { createClient } from '@/lib/datasource/supabase/server'

export const signInWithPasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; password: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) throw new Error(error.message)
  })

/**
 * Magic-link sign-in used by the company (tenant) portal. We send the OTP
 * email with `shouldCreateUser: true` so invited-but-not-yet-signed-up
 * company users can activate their auth account by clicking the link. The
 * caller MUST pre-validate membership via `checkCompanyEmailMembershipFn`
 * so we don't spray magic-link emails to random addresses.
 */
export const signInWithOtpFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { email: string; emailRedirectTo: string }) => data,
  )
  .handler(async ({ data }): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: data.email,
      options: {
        emailRedirectTo: data.emailRedirectTo,
        shouldCreateUser: true,
      },
    })
    if (error) throw new Error(error.message)
  })

/**
 * Public, pre-auth check used by the tenant login page. Returns `true` only
 * if the email maps to an `app_company_users` row for the given company
 * slug. Backed by a SECURITY DEFINER RPC so we don't need a permissive
 * anon SELECT policy on company membership tables.
 */
export const checkCompanyEmailMembershipFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { companySlug: string; email: string }) => data,
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const supabase = createClient()
    const { data: row, error } = await (supabase.rpc as any)(
      'check_company_member_email',
      { p_slug: data.companySlug, p_email: data.email },
    )
    if (error) throw new Error(error.message)
    return { ok: row === true }
  })

export type SignUpResult =
  | { status: 'created' }
  | { status: 'confirm_sent' }
  | { status: 'already_registered' }

export const signUpFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { email: string; password: string; emailRedirectTo: string }) => data,
  )
  .handler(async ({ data }): Promise<SignUpResult> => {
    const supabase = createClient()
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { emailRedirectTo: data.emailRedirectTo },
    })
    if (error) throw new Error(error.message)
    // Supabase masks "email already exists + confirmed" as a successful signup
    // with an empty `identities` array and no session. No confirmation email
    // is fired server-side, so we must surface this to the caller.
    if (result.user && (result.user.identities?.length ?? 0) === 0) {
      return { status: 'already_registered' }
    }
    if (result.session) return { status: 'created' }
    return { status: 'confirm_sent' }
  })

export const signOutFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<void> => {
    const supabase = createClient()
    await supabase.auth.signOut()
  },
)

export const resendSignUpConfirmationFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; emailRedirectTo: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: data.email,
      options: { emailRedirectTo: data.emailRedirectTo },
    })
    if (error) throw new Error(error.message)
  })

export const resetPasswordForEmailFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { email: string; redirectTo: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    })
    if (error) throw new Error(error.message)
  })

export const updatePasswordFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }): Promise<void> => {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) throw new Error(error.message)
  })
