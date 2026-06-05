import { createServerFn } from '@tanstack/react-start'

import {
  requireWorkOsEnv,
  workOsApiOrigin,
} from '@/lib/auth/workos/config'
import { setWorkOsAccessTokenCookie } from '@/lib/auth/workos/session-cookie.server'
import type { WorkOSTokenResponse } from '@/lib/auth/workos/types'

export type HandleWorkOSCallbackInput = {
  code: string
  redirectUri: string
}

export type HandleWorkOSCallbackResult = {
  tokens: WorkOSTokenResponse
  /** True when the WorkOS access token was stored in an httpOnly cookie. */
  sessionEstablished: boolean
}

/**
 * Exchanges a WorkOS authorization code for access (and optional refresh) tokens.
 *
 * @see https://workos.com/docs/reference/authkit/authentication
 */
export const handleWorkOSCallbackFn = createServerFn({ method: 'POST' })
  .inputValidator((data: HandleWorkOSCallbackInput) => data)
  .handler(async ({ data }): Promise<HandleWorkOSCallbackResult> => {
    const env = requireWorkOsEnv()
    const origin = workOsApiOrigin(env.authDomain)

    const response = await fetch(`${origin}/user_management/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: env.clientId,
        client_secret: env.apiKey,
        grant_type: 'authorization_code',
        code: data.code,
        redirect_uri: data.redirectUri,
      }),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `WorkOS token exchange failed (${response.status}): ${body}`,
      )
    }

    const json = (await response.json()) as {
      access_token?: string
      refresh_token?: string
      user?: { id?: string; email?: string }
    }

    const accessToken = json.access_token
    if (!accessToken) {
      throw new Error('WorkOS token exchange returned no access_token')
    }

    const userEmail = json.user?.email?.trim().toLowerCase()
    setWorkOsAccessTokenCookie(accessToken, userEmail)

    return {
      tokens: {
        accessToken,
        refreshToken: json.refresh_token,
        userId: json.user?.id,
        userEmail,
      },
      sessionEstablished: true,
    }
  })
