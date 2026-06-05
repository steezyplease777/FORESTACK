import { createServerFn } from '@tanstack/react-start'

import type { WorkOSConnectionConfig } from '@/lib/auth/workos/types'

export type ResolvedOrgIdp =
  | { kind: 'workos'; connection: WorkOSConnectionConfig }
  | { kind: 'supabase_fallback' }
  | null

/**
 * Loads the primary IdP for an organization.
 *
 * TODO (Phase 2): query `app_organization_identity_providers` where
 * `organization_id = ?` and `is_primary = true`. When `provider_kind` is
 * `workos`, map the row through `workOsConfigFromRow`.
 */
export const resolveOrgIdpFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data }): Promise<ResolvedOrgIdp> => {
    // Stub: schema + credentials not wired — magic link remains the only path.
    void data.organizationId
    return null
  })
