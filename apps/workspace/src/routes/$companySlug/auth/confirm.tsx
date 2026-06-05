import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import type { EmailOtpType } from '@supabase/supabase-js'

import { createClient } from '@/lib/datasource/supabase/server'
import { safeRelativeRedirectPath } from '@/lib/utils/safe-redirect'

type ConfirmSearch = {
  token_hash?: string
  type?: EmailOtpType | string
  code?: string
  next?: string
}

const exchange = createServerFn({ method: 'GET' })
  .inputValidator((data: ConfirmSearch) => data)
  .handler(async ({ data }) => {
    const supabase = createClient()
    const next = safeRelativeRedirectPath(data.next)

    if (data.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(data.code)
      if (error) return { ok: false, message: error.message }
      return { ok: true, next }
    }

    if (data.token_hash && data.type) {
      const { error } = await supabase.auth.verifyOtp({
        type: data.type as EmailOtpType,
        token_hash: data.token_hash,
      })
      if (error) return { ok: false, message: error.message }
      return { ok: true, next }
    }

    return { ok: false, message: 'Invalid or missing verification parameters' }
  })

export const Route = createFileRoute('/$companySlug/auth/confirm')({
  validateSearch: (search: Record<string, unknown>): ConfirmSearch => ({
    token_hash:
      typeof search.token_hash === 'string' ? search.token_hash : undefined,
    type: typeof search.type === 'string' ? search.type : undefined,
    code: typeof search.code === 'string' ? search.code : undefined,
    next: typeof search.next === 'string' ? search.next : undefined,
  }),
  beforeLoad: async ({ params, search }) => {
    const result = await exchange({ data: search })
    if (!result.ok) {
      throw redirect({
        to: '/$companySlug/error',
        params: { companySlug: params.companySlug },
        search: { error: result.message } as any,
      })
    }
    throw redirect({ href: result.next as string })
  },
})
