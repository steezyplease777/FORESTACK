import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Building2, Plus, Users } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient as createBrowserSupabase } from '@/lib/datasource/supabase/client'
import { signOutFn } from '@/lib/data/auth/server'
import { listMyOrganizationsFn } from '@/lib/data/organizations/server'

/**
 * `/app` landing - "My organizations".
 *
 * Shows only orgs where the caller is OWNER or ADMIN. A pure COMPANY user
 * who somehow lands here (for example, they were demoted but their JWT
 * still has a stale `saas_orgs` entry) will see an empty list and the
 * same "Create organization" CTA a brand-new signup sees. That's the
 * intended UX: the SaaS portal is a paid product; if you're not an
 * owner/admin anywhere, your only SaaS-side action is to start your own.
 *
 * The previous behaviour of this route - auto-redirect into a single
 * org's dashboard when the user belongs to exactly one - is intentionally
 * gone. Having a stable landing page is more predictable once a user can
 * own multiple orgs, and the one-click "Open" from a card is trivial.
 */
const Route = createFileRoute('/_authed/app/')({
  loader: async ({ context }) => {
    const organizations = await listMyOrganizationsFn()
    const claimOrgIds =
      context.session?.status === 'ok' ? context.session.saasOrgIds : []
    return { organizations, claimOrgIds }
  },
  component: MyOrganizationsPage,
})

function MyOrganizationsPage() {
  const { organizations, claimOrgIds } = Route.useLoaderData()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const didSelfHealRef = useRef(false)

  // Filter to OWNER/ADMIN memberships only. We intentionally derive from
  // `role` here rather than the session's saasOrgIds claim because the
  // claim can be briefly stale after a role mutation until the next
  // token refresh, and the list endpoint is always fresh.
  const saasOrgs = organizations.filter(
    (o) => o.role === 'OWNER' || o.role === 'ADMIN',
  )

  // Self-heal for sessions that predate the Custom Access Token Hook:
  // the user has OWNER/ADMIN rows in the DB but their JWT has no
  // `saas_orgs` claim yet, so every /app/org/:orgId click would 404.
  // Refresh the session once to get a token with the populated claim,
  // then invalidate the session cache so the guard picks it up. The
  // ref guard prevents re-running on re-render.
  useEffect(() => {
    if (didSelfHealRef.current) return
    if (saasOrgs.length === 0) return
    if (claimOrgIds.length > 0) return
    didSelfHealRef.current = true
    const supabase = createBrowserSupabase()
    void supabase.auth
      .refreshSession()
      .then(() => queryClient.invalidateQueries({ queryKey: ['saasSession'] }))
  }, [saasOrgs.length, claimOrgIds.length, queryClient])

  const handleSignOut = async () => {
    await signOutFn()
    navigate({ to: '/login' })
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-white px-4 md:px-6">
        <Link
          to="/app"
          className="flex items-center gap-2 font-medium text-foreground"
        >
          <img
            src="/applogo.png"
            alt="Forestack"
            width={24}
            height={24}
            className="rounded"
          />
          <span className="text-sm font-semibold uppercase tracking-wide">
            Forestack
          </span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="text-muted-foreground"
        >
          Sign out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-6">
        {saasOrgs.length === 0 ? (
          <EmptyState />
        ) : (
          <OrganizationsList orgs={saasOrgs} />
        )}
      </main>
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-6 w-6 text-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-foreground">
            No organizations yet
          </h1>
          <p className="text-sm text-muted-foreground">
            The SaaS dashboard is used to manage organizations you own or
            administer. Create one to get started.
          </p>
        </div>
        <Button asChild size="sm" className="mt-2">
          <Link to="/onboarding">
            <Plus className="mr-1 h-4 w-4" />
            Create organization
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function OrganizationsList({
  orgs,
}: {
  orgs: Awaited<ReturnType<typeof listMyOrganizationsFn>>
}) {
  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            My organizations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You own or administer {orgs.length} organization
            {orgs.length === 1 ? '' : 's'}.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link to="/onboarding">
            <Plus className="mr-1 h-4 w-4" />
            Create organization
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {orgs.map((org) => (
          <Link
            key={org.id}
            to="/app/org/$orgId/dashboard"
            params={{ orgId: org.id }}
            className="block"
          >
            <Card className="transition-colors hover:border-foreground/40 hover:shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <Avatar className="h-10 w-10 rounded-md">
                  {org.logoUrl ? (
                    <AvatarImage src={org.logoUrl} alt={org.name} />
                  ) : null}
                  <AvatarFallback className="rounded-md bg-foreground text-sm text-white">
                    {org.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {org.name}
                    </span>
                    {org.role ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {org.role}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {org.companyCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {org.userCount}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route }
