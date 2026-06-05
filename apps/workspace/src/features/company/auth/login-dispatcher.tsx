import { useEffect, useState } from 'react'

import { LoginForm } from '@/features/company/login-portal'
import { WorkOSLoginButton } from '@/features/company/auth/workos-login-button'
import { resolveOrgIdpFn, type ResolvedOrgIdp } from '@/lib/auth/workos'
import { Separator } from '@/components/ui/separator'

type LoginDispatcherProps = {
  organizationId: string
  companySlug: string
  className?: string
}

/**
 * Routes tenant login to WorkOS SSO when the org has a primary WorkOS IdP row,
 * otherwise falls back to the existing Supabase magic-link form.
 */
export function LoginDispatcher({
  organizationId,
  companySlug,
  className,
}: LoginDispatcherProps) {
  const [idp, setIdp] = useState<ResolvedOrgIdp | 'loading'>('loading')

  useEffect(() => {
    let cancelled = false
    void resolveOrgIdpFn({ data: { organizationId } }).then((result) => {
      if (!cancelled) setIdp(result)
    })
    return () => {
      cancelled = true
    }
  }, [organizationId])

  if (idp === 'loading') {
    return (
      <div className={className}>
        <LoginForm />
      </div>
    )
  }

  if (idp?.kind === 'workos') {
    return (
      <div className={className}>
        <div className="flex flex-col gap-4">
          <WorkOSLoginButton
            companySlug={companySlug}
            connection={idp.connection}
          />
          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <LoginForm />
    </div>
  )
}
