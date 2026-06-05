import { createServerFn } from '@tanstack/react-start'

import {
  requireWorkOsEnv,
  workOsApiOrigin,
} from '@/lib/auth/workos/config'
import type { WorkOSAuthorizeInput } from '@/lib/auth/workos/types'

function readEnv(name: string): string | undefined {
  return (
    (typeof process !== 'undefined' ? process.env[name] : undefined) ??
    (import.meta.env as Record<string, string | undefined>)[name]
  )
}

export type GetWorkOSAuthorizationUrlInput = {
  companySlug: string
  redirectUri: string
  state: string
  workosOrganizationId?: string
  connectionId?: string
}

export type GetWorkOSAuthorizationUrlResult = {
  url: string
}

function buildAuthorizationUrl(
  input: WorkOSAuthorizeInput,
  clientId: string,
  authDomain: string,
): string {
  const origin = workOsApiOrigin(authDomain)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: 'code',
    state: input.state,
  })

  const orgId =
    input.connection?.workosOrganizationId ??
    input.connection?.organizationId
  const connectionId = input.connection?.connectionId

  if (connectionId) {
    params.set('connection', connectionId)
  } else if (orgId) {
    params.set('organization', orgId)
  }

  return `${origin}/user_management/authorize?${params.toString()}`
}

/**
 * Returns a WorkOS AuthKit authorization URL for enterprise SSO.
 *
 * @see https://workos.com/docs/reference/authkit/authentication/get-authorization-url
 */
export const getWorkOSAuthorizationUrlFn = createServerFn({ method: 'POST' })
  .inputValidator((data: GetWorkOSAuthorizationUrlInput) => data)
  .handler(async ({ data }): Promise<GetWorkOSAuthorizationUrlResult> => {
    const env = requireWorkOsEnv()
    const workosOrganizationId =
      data.workosOrganizationId?.trim() ||
      readEnv('WORKOS_DEV_ORGANIZATION_ID')?.trim() ||
      undefined

    const url = buildAuthorizationUrl(
      {
        companySlug: data.companySlug,
        redirectUri: data.redirectUri,
        state: data.state,
        connection: workosOrganizationId || data.connectionId
          ? {
              organizationId: workosOrganizationId ?? '',
              issuerUrl: '',
              workosOrganizationId,
              connectionId: data.connectionId,
            }
          : undefined,
      },
      env.clientId,
      env.authDomain,
    )

    return { url }
  })
