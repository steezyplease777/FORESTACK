import { useState } from 'react'
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Building2, LogOut, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient as createBrowserSupabase } from '@/lib/datasource/supabase/client'
import { onboardSaasUserFn } from '@/lib/data/onboarding/server'
import { signOutFn } from '@/lib/data/auth/server'
import { loadSaasSessionStatus } from '@/lib/data/auth/saas-session'

/**
 * `/onboarding` used to be a mandatory gate every new SaaS signup had to
 * pass before they could touch any other route. In the new landing model
 * it's just the "create an organization" flow, reachable from:
 *
 *   * The `/app` empty-state CTA (a brand-new signup with no orgs).
 *   * The "Create organization" button on `/app` when the user already
 *     owns one or more orgs and wants to spin up another.
 *
 * The only redirect we still perform here is for unauthed users - you
 * can't create an org without a session.
 */
const Route = createFileRoute('/onboarding')({
  beforeLoad: async () => {
    const session = await loadSaasSessionStatus()
    if (session.status === 'wrong-host') {
      throw redirect({ href: session.redirectTo })
    }
    if (session.status === 'unauthed') {
      throw redirect({ to: '/login' })
    }
    return {
      email: session.email ?? '',
      hasSaasAccess: session.saasOrgIds.length > 0,
    }
  },
  component: OnboardingPage,
})

function OnboardingPage() {
  const { email, hasSaasAccess } = Route.useRouteContext()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    orgName.trim().length >= 2 &&
    !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsSubmitting(true)
    try {
      const { organizationId } = await onboardSaasUserFn({
        data: {
          orgName: orgName.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      })

      // Refresh the Supabase session so the next access token includes the
      // newly-created org in the `saas_orgs` claim. Without this, the
      // per-org route guard at /app/org/:orgId would 404 on the brand-new
      // org until the token naturally rolls over (~1h). The session cache
      // also needs to be invalidated so TanStack re-reads the fresh claim.
      const supabase = createBrowserSupabase()
      await supabase.auth.refreshSession()
      await queryClient.invalidateQueries({ queryKey: ['saasSession'] })

      navigate({
        to: '/app/org/$orgId/dashboard',
        params: { orgId: organizationId },
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    await signOutFn()
    navigate({ to: '/login' })
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between gap-4">
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
          {hasSaasAccess ? (
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to="/app">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to workspaces
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground"
            >
              <LogOut className="mr-1 h-4 w-4" />
              Sign out
            </Button>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {hasSaasAccess
                    ? 'Create a new organization'
                    : 'Welcome to Forestack'}
                </CardTitle>
                <CardDescription>
                  {hasSaasAccess
                    ? "You'll be the Owner of this organization and can invite teammates afterwards."
                    : "Let's set up your workspace. This only takes a minute."}
                  {email ? (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Signed in as <span className="font-mono">{email}</span>
                    </span>
                  ) : null}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <User className="h-4 w-4 text-muted-foreground" />
                      About you
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input
                          id="first-name"
                          required
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input
                          id="last-name"
                          required
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      Your organization
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="org-name">Organization name</Label>
                      <Input
                        id="org-name"
                        required
                        placeholder="Acme Inc."
                        autoComplete="organization"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                      />
                    </div>
                  </section>

                  {error ? (
                    <p className="text-sm text-red-500" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit}
                  >
                    {isSubmitting ? (
                      'Creating organization…'
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    You&apos;ll be the Owner and can invite teammates
                    afterwards.
                  </p>
                </form>
              </CardContent>
            </Card>
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
