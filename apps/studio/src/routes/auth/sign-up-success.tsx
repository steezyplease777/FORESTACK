import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { resendSignUpConfirmationFn } from '@/lib/data/auth/server'

type SignUpSuccessSearch = { email?: string }

export const Route = createFileRoute('/auth/sign-up-success')({
  validateSearch: (search: Record<string, unknown>): SignUpSuccessSearch => ({
    email: typeof search.email === 'string' ? search.email : undefined,
  }),
  component: Page,
})

function Page() {
  const { email } = Route.useSearch()
  const [isResending, setIsResending] = useState(false)
  const [resendState, setResendState] = useState<
    { kind: 'idle' } | { kind: 'sent' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  const handleResend = async () => {
    if (!email) return
    setIsResending(true)
    setResendState({ kind: 'idle' })
    try {
      await resendSignUpConfirmationFn({
        data: {
          email,
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=%2Fapp`,
        },
      })
      setResendState({ kind: 'sent' })
    } catch (err: unknown) {
      setResendState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to resend email',
      })
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              {email ? (
                <>
                  We sent a confirmation link to{' '}
                  <span className="font-medium text-foreground">{email}</span>.
                  Click the link to activate your account.
                </>
              ) : (
                'We sent you a confirmation link. Click the link to activate your account.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t get an email? Check your spam folder, or resend below.
            </p>

            {resendState.kind === 'sent' && (
              <p className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                Sent. Give it a minute to arrive.
              </p>
            )}
            {resendState.kind === 'error' && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
                {resendState.message}
              </p>
            )}

            <Button
              onClick={handleResend}
              disabled={!email || isResending}
              className="w-full"
            >
              {isResending ? 'Resending…' : 'Resend confirmation email'}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/login">Back to login</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/auth/sign-up">Use a different email</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
