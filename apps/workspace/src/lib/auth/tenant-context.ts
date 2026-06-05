import { createClient } from '@/lib/datasource/supabase/server'
import { isWorkOsAuthEnabled } from '@/lib/auth/workos/config'

export type TenantContext = {
  companyId: string
  organizationId: string
  userEmail: string
  organizationUserId: string | null
  companyUserId: string | null
}

export type CompanyUserProfile = {
  companyUserId: string
  organizationUserId: string
  email: string
  firstName: string | null
  lastName: string | null
  profilePictureUrl: string | null
}

/** External IdP identity for Third-Party Auth membership matching (Phase 2). */
export type ExternalIdentity = {
  subjectId: string
  issuer: string
}

/**
 * When `WORKOS_AUTH_ENABLED` is set, match company users by WorkOS JWT claims
 * (`sub` + `iss`) instead of email. Requires `external_subject_id` and
 * `external_issuer` columns on `app_company_users`.
 *
 * TODO (Phase 2): replace stub with a real query once schema migrates.
 */
async function requireCompanyAccessByExternalIdentity(
  companyId: string,
  identity: ExternalIdentity,
  organizationId: string,
): Promise<{
  companyMembership?: TenantContext
  companyUser?: CompanyUserProfile
  error?: string
} | null> {
  if (!isWorkOsAuthEnabled()) return null

  // Stub until columns exist — fall back to email matching.
  void companyId
  void identity
  void organizationId
  return null
}

export async function requireCompanyAccess(
  companyId: string,
  userEmail: string | null,
  organizationId: string,
  externalIdentity?: ExternalIdentity | null,
): Promise<{
  companyMembership?: TenantContext
  companyUser?: CompanyUserProfile
  error?: string
}> {
  if (externalIdentity) {
    const byExternal = await requireCompanyAccessByExternalIdentity(
      companyId,
      externalIdentity,
      organizationId,
    )
    if (byExternal) return byExternal
  }

  if (!userEmail) return { error: 'No user email' }

  const supabase = createClient()
  // Select profile fields in one go so the tenant sidebar can render without a
  // second browser-side REST round-trip.
  const { data, error } = await supabase
    .from('app_company_users')
    .select(
      `id, company_id, org_user_id!inner (id, email, first_name, last_name, profile_picture_url)`,
    )
    .eq('company_id', companyId)
    .eq('org_user_id.email', userEmail)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!data) return { error: 'No company membership found' }

  type OrgUserRow = {
    id: string
    email: string
    first_name: string | null
    last_name: string | null
    profile_picture_url: string | null
  }
  const rel = data.org_user_id as OrgUserRow | Array<OrgUserRow> | null
  const orgUser = Array.isArray(rel) ? (rel[0] ?? null) : rel

  return {
    companyMembership: {
      companyId,
      organizationId,
      userEmail,
      organizationUserId: orgUser?.id ?? null,
      companyUserId: data.id ?? null,
    },
    companyUser: orgUser
      ? {
          companyUserId: data.id,
          organizationUserId: orgUser.id,
          email: orgUser.email,
          firstName: orgUser.first_name,
          lastName: orgUser.last_name,
          profilePictureUrl: orgUser.profile_picture_url,
        }
      : undefined,
  }
}

export async function listOrganizationsForUser(email: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('app_organization_users')
    .select('id, organization_id, app_organizations!inner (id, name, slug)')
    .eq('email', email)
  if (error) return []
  return (data ?? []).map((row: any) => ({
    id: row.app_organizations?.id,
    name: row.app_organizations?.name,
    slug: row.app_organizations?.slug,
  }))
}

export function companyContextQueryKey(companySlug: string) {
  return ['companyContext', companySlug] as const
}
