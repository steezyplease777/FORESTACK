import { createFileRoute, redirect } from '@tanstack/react-router'

import { LoginForm } from '@/features/saas/login-portal'
import { loadSaasSessionStatus } from '@/lib/data/auth/saas-session'

const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Already-authed users shouldn't see the login form. Send them to /app -
    // whether their landing renders the "My organizations" list or the
    // empty-state CTA is a concern of that route, not this one.
    const session = await loadSaasSessionStatus()
    if (session.status === 'wrong-host') {
      throw redirect({ href: session.redirectTo })
    }
    if (session.status === 'ok') {
      throw redirect({ to: '/app' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <img
              src="/applogo.png"
              alt="Forestack"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-md font-semibold uppercase tracking-wide text-foreground">
              Forestack
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden md:block bg-background">
        <img
          src="/appLoginImage.png"
          alt="Forestack"
          className="absolute inset-0 h-full w-full object-contain p-16"
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route }
