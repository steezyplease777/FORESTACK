import { useState } from 'react'
import { useParams } from '@tanstack/react-router'

import { cn } from '@/lib/utils/format/formatting'
import {
  checkCompanyEmailMembershipFn,
  signInWithOtpFn,
} from '@/lib/data/auth/server'
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

/**
 * Tenant portal sign-in.
 *
 * We intentionally do NOT accept passwords here. Every company user signs in
 * via a magic link delivered to an email we've pre-validated against
 * `app_company_users` for this tenant's slug. The pre-check lets us surface
 * an "Access Denied" message instantly for non-members rather than sending
 * them a link that would just bounce at the `_authed` gate.
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const { companySlug } = useParams({ strict: false }) as {
    companySlug?: string
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companySlug) {
      setError('Missing company context. Reload the page and try again.')
      return
    }
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your work email to continue.')
      return
    }

    setStatus('sending')
    setError(null)

    try {
      const membership = await checkCompanyEmailMembershipFn({
        data: { companySlug, email: trimmed },
      })
      if (!membership.ok) {
        setStatus('idle')
        setError(
          'Access Denied. Contact your administrator for further help.',
        )
        return
      }

      const origin =
        typeof window !== 'undefined' ? window.location.origin : ''
      await signInWithOtpFn({
        data: {
          email: trimmed,
          emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
        },
      })
      setStatus('sent')
    } catch (err: unknown) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We sent a sign-in link to <strong>{email.trim()}</strong>. Open
              it on this device to finish signing in. The link expires
              shortly, so use it soon.
            </CardDescription>
          </CardHeader>
          <CardContent >
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setStatus('idle')
                setError(null)
              }}
            >
              Use a different email
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Enter your work email and we&apos;ll send a secure sign-in link.
          </CardDescription>
        </CardHeader>
        <CardContent >
          <form onSubmit={handleSend}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'sending'}
                />
              </div>
              {error && (
                <p
                  className="text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending link...' : 'Send sign-in link'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
