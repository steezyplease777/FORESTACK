import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { signOutFn } from '@/lib/data/auth/server'
import { loadSaasSessionStatus } from '@/lib/data/auth/saas-session'

const Route = createFileRoute('/access-denied')({
  // Access-denied lives outside `_authed`, so we re-derive session state
  // here. An authed user with no SaaS orgs should be on /app (which now
  // renders the empty-state CTA), not on this dead-end page - those users
  // aren't "denied", they're "not yet". Only signed-out callers land here.
  beforeLoad: async () => {
    const session = await loadSaasSessionStatus()
    if (session.status === 'wrong-host') {
      throw redirect({ href: session.redirectTo })
    }
    if (session.status === 'unauthed') {
      throw redirect({ to: '/login' })
    }
    if (session.status === 'ok') {
      throw redirect({ to: '/app' })
    }
  },
  component: AccessDeniedPage,
})

function AccessDeniedPage() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOutFn()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <ShieldX className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Access Denied</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your account does not have access to the Forestack dashboard.
        Contact your organization administrator to request access.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/login' })}>
          Try a different account
        </Button>
        <Button size="sm" variant="outline" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route }
