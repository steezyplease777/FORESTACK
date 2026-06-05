import type { WorkOsIdpConfig } from '@/config/identity-providers'

/** Resolved WorkOS SSO settings for a single tenant org. */
export type WorkOSConnectionConfig = {
  organizationId: string
  issuerUrl: string
  workosOrganizationId?: string
  connectionId?: string
  loginHintDomains?: string[]
}

export function workOsConfigFromRow(
  organizationId: string,
  issuerUrl: string,
  config: WorkOsIdpConfig,
): WorkOSConnectionConfig {
  return {
    organizationId,
    issuerUrl,
    workosOrganizationId: config.workos_organization_id,
    connectionId: config.connection_id,
    loginHintDomains: config.login_hint_domains,
  }
}

/** Input for building an AuthKit authorization URL. */
export type WorkOSAuthorizeInput = {
  companySlug: string
  redirectUri: string
  state: string
  connection?: WorkOSConnectionConfig
}

/** Result of exchanging an authorization code at WorkOS. */
export type WorkOSTokenResponse = {
  accessToken: string
  refreshToken?: string
  /** WorkOS user id — maps to JWT `sub` after token refresh. */
  userId?: string
}

/** Claims we expect in a WorkOS access token (Third-Party Auth). */
export type WorkOSJwtClaims = {
  sub: string
  iss: string
  email?: string
  role?: string
  user_role?: string
}

export class WorkOSNotConfiguredError extends Error {
  constructor(message = 'WorkOS is not configured. Set WORKOS_API_KEY and WORKOS_CLIENT_ID.') {
    super(message)
    this.name = 'WorkOSNotConfiguredError'
  }
}

export class WorkOSMissingConnectionSelectorError extends Error {
  constructor(
    message = 'WorkOS SSO requires a WorkOS organization or connection. Set WORKOS_DEV_ORGANIZATION_ID in .env.local (dev) or add workos_organization_id to the org IdP config in app_organization_identity_providers.',
  ) {
    super(message)
    this.name = 'WorkOSMissingConnectionSelectorError'
  }
}

/** Server-fn errors lose their class across the wire; match by name or message too. */
export function isWorkOsNotConfiguredError(err: unknown): boolean {
  return (
    err instanceof WorkOSNotConfiguredError ||
    (err instanceof Error &&
      (err.name === 'WorkOSNotConfiguredError' ||
        err.message.includes('WorkOS is not configured')))
  )
}

export function isWorkOsMissingConnectionSelectorError(err: unknown): boolean {
  return (
    err instanceof WorkOSMissingConnectionSelectorError ||
    (err instanceof Error &&
      (err.name === 'WorkOSMissingConnectionSelectorError' ||
        err.message.includes('WORKOS_DEV_ORGANIZATION_ID') ||
        err.message.includes('workos_organization_id')))
  )
}
