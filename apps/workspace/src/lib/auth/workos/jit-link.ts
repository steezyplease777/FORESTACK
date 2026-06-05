import { createServiceRoleClient } from '@/lib/datasource/supabase/admin.server'
import { decodeWorkOsJwtClaims } from '@/lib/auth/workos/jwt-claims'

/**
 * First-time WorkOS SSO: attach `sub` + `iss` to an existing company user row
 * matched by email. Requires `SUPABASE_SERVICE_ROLE_KEY` on the server.
 */
export async function jitLinkWorkOsCompanyUser(input: {
  companyId: string
  accessToken: string
  /** From WorkOS authenticate `user.email` when the JWT omits `email`. */
  emailOverride?: string
}): Promise<{ linked: boolean; reason?: string }> {
  const claims = decodeWorkOsJwtClaims(input.accessToken)
  if (!claims) return { linked: false, reason: 'invalid_token' }

  const email =
    input.emailOverride?.trim().toLowerCase() ??
    claims.email?.trim().toLowerCase()
  if (!email) return { linked: false, reason: 'no_email_claim' }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return { linked: false, reason: 'no_service_role' }
  }

  const { data: row, error: findError } = await admin
    .from('app_company_users')
    .select(
      'id, external_subject_id, external_issuer, org_user_id!inner (email)',
    )
    .eq('company_id', input.companyId)
    .ilike('org_user_id.email', email)
    .maybeSingle()

  if (findError) {
    console.warn('[jitLinkWorkOs] lookup failed:', findError.message)
    return { linked: false, reason: 'lookup_failed' }
  }

  if (!row) return { linked: false, reason: 'no_company_user' }

  if (
    row.external_subject_id === claims.sub &&
    row.external_issuer === claims.iss
  ) {
    return { linked: true }
  }

  const { error: updateError } = await admin
    .from('app_company_users')
    .update({
      external_subject_id: claims.sub,
      external_issuer: claims.iss,
    })
    .eq('id', row.id)

  if (updateError) {
    console.warn('[jitLinkWorkOs] update failed:', updateError.message)
    return { linked: false, reason: 'update_failed' }
  }

  return { linked: true }
}
