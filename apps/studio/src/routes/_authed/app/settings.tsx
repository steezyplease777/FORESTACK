import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signOutFn } from '@/lib/data/auth/server'
import { listMyOrganizationsFn } from '@/lib/data/organizations/server'

export const Route = createFileRoute('/_authed/app/settings')({
  loader: async () => {
    const organizations = await listMyOrganizationsFn()
    return { organizations }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { organizations } = Route.useLoaderData()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOutFn()
    navigate({ to: '/login' })
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 md:px-6">
      <div className="mb-4 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm">
          <Link to="/app">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to app
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-1 h-4 w-4" />
          Sign out
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-semibold text-foreground">
        Account settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-muted">
            {organizations.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {o.name}
                  </p>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {o.slug ?? '—'}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {o.role ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Profile editing, password, and avatar upload coming soon.
      </p>
    </div>
  )
}
