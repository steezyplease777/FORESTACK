/**
 * Per-org identity provider kinds for tenant portal auth.
 *
 * @see docs/roadmap/split-auth-per-org-idp.md
 * @see docs/roadmap/workos-workspace-implementation-plan.md
 */

export const PROVIDER_KINDS = [
  'workos',
  'auth0',
  'clerk',
  'supabase_fallback',
] as const

export type ProviderKind = (typeof PROVIDER_KINDS)[number]

/** Rows in `app_organization_identity_providers` (schema not migrated yet). */
export type OrganizationIdentityProviderRow = {
  id: string
  organization_id: string
  provider_kind: ProviderKind
  issuer_url: string
  jwks_url: string | null
  config: Record<string, unknown>
  allowed_email_domains: string[] | null
  is_primary: boolean
}

/** WorkOS-specific fields stored in `config` jsonb. */
export type WorkOsIdpConfig = {
  workos_organization_id?: string
  connection_id?: string
  login_hint_domains?: string[]
}

export function isWorkOsProvider(
  row: OrganizationIdentityProviderRow,
): row is OrganizationIdentityProviderRow & { provider_kind: 'workos' } {
  return row.provider_kind === 'workos'
}
