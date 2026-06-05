import { createServerFn } from '@tanstack/react-start'

import {
  requireWorkOsEnv,
  workOsApiOrigin,
} from '@/lib/auth/workos/config'
import type { WorkOSAuthorizeInput } from '@/lib/auth/workos/types'

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

    const url = buildAuthorizationUrl(
      {
        companySlug: data.companySlug,
        redirectUri: data.redirectUri,
        state: data.state,
        connection: data.workosOrganizationId || data.connectionId
          ? {
              organizationId: data.workosOrganizationId ?? '',
              issuerUrl: '',
              workosOrganizationId: data.workosOrganizationId,
              connectionId: data.connectionId,
            }
          : undefined,
      },
      env.clientId,
      env.authDomain,
    )

    return { url }
  })
