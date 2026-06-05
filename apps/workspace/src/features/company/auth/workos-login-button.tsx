import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  getWorkOSAuthorizationUrlFn,
  type WorkOSConnectionConfig,
} from '@/lib/auth/workos'
import { buildWorkOsRedirectUri } from '@/lib/auth/workos/redirect-uri'
import { WorkOSNotConfiguredError } from '@/lib/auth/workos/types'

type WorkOSLoginButtonProps = {
  companySlug: string
  connection: WorkOSConnectionConfig
  nextPath?: string
}

function encodeOAuthState(companySlug: string, nextPath: string): string {
  return btoa(JSON.stringify({ companySlug, next: nextPath }))
}

export function WorkOSLoginButton({
  companySlug,
  connection,
  nextPath = '/',
}: WorkOSLoginButtonProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSso = async () => {
    setLoading(true)
    setError(null)
    try {
      const redirectUri = buildWorkOsRedirectUri(
        companySlug,
        typeof window !== 'undefined' ? window.location.host : undefined,
      )
      const state = encodeOAuthState(companySlug, nextPath)

      const { url } = await getWorkOSAuthorizationUrlFn({
        data: {
          companySlug,
          redirectUri,
          state,
          workosOrganizationId: connection.workosOrganizationId,
          connectionId: connection.connectionId,
        },
      })

      window.location.assign(url)
    } catch (err: unknown) {
      setLoading(false)
      if (err instanceof WorkOSNotConfiguredError) {
        setError('SSO is not configured for this workspace yet.')
        return
      }
      setError(err instanceof Error ? err.message : 'Unable to start SSO.')
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={handleSso}
      >
        {loading ? 'Redirecting…' : 'Sign in with SSO'}
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
