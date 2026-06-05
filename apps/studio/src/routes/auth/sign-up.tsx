import { createFileRoute, redirect } from '@tanstack/react-router'

import { SignUpForm } from '@/features/saas/signup-portal'
import { loadSaasSessionStatus } from '@/lib/data/auth/saas-session'

const Route = createFileRoute('/auth/sign-up')({
  beforeLoad: async () => {
    // Mirror /login: a user with an existing session shouldn't be able to
    // land on the sign-up form. Forward them into /app.
    const session = await loadSaasSessionStatus()
    if (session.status === 'wrong-host') {
      throw redirect({ href: session.redirectTo })
    }
    if (session.status === 'ok') {
      throw redirect({ to: '/app' })
    }
  },
  component: Page,
})

function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignUpForm />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route }
