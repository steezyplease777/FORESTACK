import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { createClient } from '@/lib/datasource/supabase/server'
import { tenantUrl, whatPortal } from '@/lib/utils/domain-type'

/**
 * Unified SaaS-portal session state. Every route under `_saasPortal` that
 * needs to decide "can this user be here?" should call this helper so we
 * derive the answer from one place instead of repeating auth + host +
 * org-membership lookups in each guard.
 *
 * Status meanings:
 *   - `wrong-host`: Caller is on a tenant subdomain but hit a studio URL;
 *     bounce them back to the tenant root so session cookies line up.
 *   - `unauthed`: No Supabase session. Public pages render; protected pages
 *     redirect to /login.
 *   - `ok`: Session exists. `saasOrgIds` comes straight from the access
 *     token's `saas_orgs` claim, which is populated by the Supabase Custom
 *     Access Token Hook (`public.custom_access_token_hook`). An empty array
 *     means the user has no OWNER/ADMIN memberships; they still reach `/app`
 *     but land on the empty-state "Create organization" CTA. Per-org guards
 *     gate actual org access against this list.
 *
 * NOTE: the old `no-org` status is intentionally gone - we no longer force
 * a new signup through /onboarding. Onboarding is now an opt-in create-org
 * flow reachable from the /app landing.
 */
type SaasSessionStatus =
  | { status: 'wrong-host'; redirectTo: string }
  | { status: 'unauthed' }
  | {
      status: 'ok'
      userId: string
      email: string | null
      saasOrgIds: Array<string>
    }

/**
 * Read the user's `saas_orgs` claim through the jwt-backed RPC. We prefer
 * the RPC to manually decoding the access token because:
 *   1. `auth.jwt()` on the DB side is the source of truth RLS also uses,
 *      so route guards and RLS agree by construction.
 *   2. The Supabase server client here would need the raw access token
 *      to decode - `supabase.auth.getUser()` doesn't expose it.
 *
 * If the hook isn't configured yet (rolling deploy, fresh env) the RPC
 * returns an empty set instead of throwing, which matches how an unauthed
 * caller would look - we then redirect them to /login via the `unauthed`
 * branch above.
 */
const loadSaasOrgIds = async (
  supabase: ReturnType<typeof createClient>,
): Promise<Array<string>> => {
  const { data, error } = await supabase.rpc('my_saas_org_ids_jwt')
  if (error) {
    // Don't hard-fail the whole session just because the claim isn't
    // populated yet - treat it as "no SaaS access" and let the landing
    // page show the empty state.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[saas-session] my_saas_org_ids_jwt failed:', error.message)
    }
    return []
  }
  if (!Array.isArray(data)) return []
  return (data as Array<string | { my_saas_org_ids_jwt?: string }>).flatMap(
    (row) =>
      typeof row === 'string'
        ? [row]
        : row && typeof row.my_saas_org_ids_jwt === 'string'
          ? [row.my_saas_org_ids_jwt]
          : [],
  )
}

const loadSaasSessionStatus = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SaasSessionStatus> => {
    const request = getRequest()
    const host = request?.headers.get('host') ?? ''
    const portal = whatPortal(host)
    if (portal.type === 'TENANT') {
      return { status: 'wrong-host', redirectTo: tenantUrl(portal.sub, '/') }
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return { status: 'unauthed' }

    const saasOrgIds = await loadSaasOrgIds(supabase)

    return {
      status: 'ok',
      userId: data.user.id,
      email: data.user.email ?? null,
      saasOrgIds,
    }
  },
)

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { loadSaasSessionStatus }
export type { SaasSessionStatus }
