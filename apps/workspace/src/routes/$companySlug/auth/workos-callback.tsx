import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

import { handleWorkOSCallbackFn } from '@/lib/auth/workos'
import { jitLinkWorkOsCompanyUser } from '@/lib/auth/workos/jit-link'
import { buildWorkOsRedirectUri } from '@/lib/auth/workos/redirect-uri'
import { resolveCompanyBySlug } from '@/lib/providers/tenant'
import { tenantPostAuthRedirect } from '@/lib/routing/tenant-post-auth-redirect'
import { safeRelativeRedirectPath } from '@/lib/utils/safe-redirect'
import { WorkOSNotConfiguredError } from '@/lib/auth/workos/types'

type WorkOSCallbackSearch = {
  code?: string
  state?: string
  error?: string
  error_description?: string
}

function decodeOAuthState(
  state: string | undefined,
): { companySlug: string; next: string } | null {
  if (!state) return null
  try {
    const parsed = JSON.parse(atob(state)) as {
      companySlug?: string
      next?: string
    }
    if (!parsed.companySlug) return null
    return {
      companySlug: parsed.companySlug,
      next: safeRelativeRedirectPath(parsed.next),
    }
  } catch {
    return null
  }
}

const processCallback = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: {
      companySlug: string
      code?: string
      state?: string
      oauthError?: string
      oauthErrorDescription?: string
    }) => data,
  )
  .handler(async ({ data }) => {
    const { getRequest } = await import('@tanstack/react-start/server')
    const requestHost = getRequest()?.headers.get('host') ?? undefined

    if (data.oauthError) {
      return {
        ok: false as const,
        message: data.oauthErrorDescription ?? data.oauthError,
      }
    }

    if (!data.code) {
      return { ok: false as const, message: 'Missing authorization code' }
    }

    const redirectUri = buildWorkOsRedirectUri(data.companySlug, requestHost)

    try {
      const result = await handleWorkOSCallbackFn({
        data: { code: data.code, redirectUri },
      })

      if (result.sessionEstablished && result.tokens.accessToken) {
        const company = await resolveCompanyBySlug(data.companySlug)
        if ('companyId' in company && company.companyId) {
          await jitLinkWorkOsCompanyUser({
            companyId: company.companyId,
            accessToken: result.tokens.accessToken,
          })
        }
      }

      const decoded = decodeOAuthState(data.state)
      const next = decoded?.next ?? '/'
      return { ok: true as const, next }
    } catch (err: unknown) {
      if (err instanceof WorkOSNotConfiguredError) {
        return { ok: false as const, message: err.message }
      }
      return {
        ok: false as const,
        message: err instanceof Error ? err.message : 'SSO callback failed',
      }
    }
  })

export const Route = createFileRoute('/$companySlug/auth/workos-callback')({
  validateSearch: (search: Record<string, unknown>): WorkOSCallbackSearch => ({
    code: typeof search.code === 'string' ? search.code : undefined,
    state: typeof search.state === 'string' ? search.state : undefined,
    error: typeof search.error === 'string' ? search.error : undefined,
    error_description:
      typeof search.error_description === 'string'
        ? search.error_description
        : undefined,
  }),
  beforeLoad: async ({ params, search }) => {
    const result = await processCallback({
      data: {
        companySlug: params.companySlug,
        code: search.code,
        state: search.state,
        oauthError: search.error,
        oauthErrorDescription: search.error_description,
      },
    })

    if (!result.ok) {
      throw redirect({
        to: '/$companySlug/error',
        params: { companySlug: params.companySlug },
        search: { error: result.message } as Record<string, string>,
      })
    }

    tenantPostAuthRedirect(params.companySlug, result.next)
  },
})
