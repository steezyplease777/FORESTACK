import { createServerFn } from '@tanstack/react-start'

import {
  isWorkOsProvider,
  type OrganizationIdentityProviderRow,
  type WorkOsIdpConfig,
} from '@/config/identity-providers'
import { createClient } from '@/lib/datasource/supabase/server'
import {
  getWorkOsEnv,
  isWorkOsAuthEnabled,
  workOsIssuerUrl,
} from '@/lib/auth/workos/config'
import type { WorkOSConnectionConfig } from '@/lib/auth/workos/types'
import { workOsConfigFromRow } from '@/lib/auth/workos/types'

export type ResolvedOrgIdp =
  | { kind: 'workos'; connection: WorkOSConnectionConfig }
  | { kind: 'supabase_fallback' }
  | null

function readEnv(name: string): string | undefined {
  return (
    (typeof process !== 'undefined' ? process.env[name] : undefined) ??
    (import.meta.env as Record<string, string | undefined>)[name]
  )
}

function isMissingIdpTableError(message: string, code?: string): boolean {
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('app_organization_identity_providers')
  )
}

/**
 * Dev-only: expose WorkOS SSO on login when `WORKOS_AUTH_ENABLED` is set but no
 * `app_organization_identity_providers` row exists yet.
 */
function devWorkOsIdp(organizationId: string): ResolvedOrgIdp {
  if (!isWorkOsAuthEnabled()) return null

  const env = getWorkOsEnv()
  const devOrgId = readEnv('WORKOS_DEV_ORGANIZATION_ID')?.trim()

  return {
    kind: 'workos',
    connection: {
      organizationId,
      issuerUrl: workOsIssuerUrl(env.clientId, env.authDomain),
      workosOrganizationId: devOrgId || undefined,
    },
  }
}

async function loadOrgIdpFromDb(
  organizationId: string,
): Promise<ResolvedOrgIdp | 'missing_table'> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('app_organization_identity_providers')
    .select(
      'organization_id, provider_kind, issuer_url, config, is_primary',
    )
    .eq('organization_id', organizationId)
    .eq('is_primary', true)
    .maybeSingle()

  if (error) {
    if (isMissingIdpTableError(error.message, error.code)) {
      return 'missing_table'
    }
    console.warn('[resolveOrgIdp] query failed:', error.message)
    return null
  }

  if (!data) return null

  const row = data as OrganizationIdentityProviderRow

  if (isWorkOsProvider(row)) {
    return {
      kind: 'workos',
      connection: workOsConfigFromRow(
        row.organization_id,
        row.issuer_url,
        row.config as WorkOsIdpConfig,
      ),
    }
  }

  if (row.provider_kind === 'supabase_fallback') {
    return { kind: 'supabase_fallback' }
  }

  return null
}

/**
 * Loads the primary IdP for an organization.
 *
 * When the IdP table is not migrated yet, returns a dev WorkOS config if
 * `WORKOS_AUTH_ENABLED` is set. With the table present, queries
 * `app_organization_identity_providers` for `is_primary = true`.
 */
export const resolveOrgIdpFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data }): Promise<ResolvedOrgIdp> => {
    const fromDb = await loadOrgIdpFromDb(data.organizationId)

    if (fromDb && fromDb !== 'missing_table') {
      return fromDb
    }

    return devWorkOsIdp(data.organizationId)
  })
