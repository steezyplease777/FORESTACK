import { isWorkOsAuthEnabled } from '@/lib/auth/workos/config'
import { createServiceRoleClient } from '@/lib/datasource/supabase/admin.server'
import { createTenantClient } from '@/lib/datasource/supabase/tenant-client.server'
import { createClient } from '@/lib/datasource/supabase/server'
import type {
  CompanyUserProfile,
  ExternalIdentity,
  TenantContext,
} from '@/lib/auth/tenant-context'

function isMissingExternalColumnError(message: string, code?: string): boolean {
  return (
    code === '42703' ||
    message.includes('external_subject_id') ||
    message.includes('external_issuer')
  )
}

type OrgUserRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
}

function companyAccessFromRow(
  data: { id: string; company_id: string },
  orgUser: OrgUserRow | null,
  companyId: string,
  organizationId: string,
  userEmail: string,
) {
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

function parseOrgUser(
  rel: OrgUserRow | Array<OrgUserRow> | null,
): OrgUserRow | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

async function requireCompanyAccessByEmailServiceRole(
  companyId: string,
  userEmail: string,
  organizationId: string,
): Promise<{
  companyMembership?: TenantContext
  companyUser?: CompanyUserProfile
} | null> {
  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return null
  }

  const { data, error } = await admin
    .from('app_company_users')
    .select(
      `id, company_id, org_user_id!inner (id, email, first_name, last_name, profile_picture_url)`,
    )
    .eq('company_id', companyId)
    .ilike('org_user_id.email', userEmail)
    .maybeSingle()

  if (error || !data) return null

  const orgUser = parseOrgUser(data.org_user_id as OrgUserRow | Array<OrgUserRow> | null)
  return companyAccessFromRow(data, orgUser, companyId, organizationId, userEmail)
}

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

  const supabase = createTenantClient()
  const { data, error } = await supabase
    .from('app_company_users')
    .select(
      `id, company_id, external_subject_id, external_issuer, org_user_id!inner (id, email, first_name, last_name, profile_picture_url)`,
    )
    .eq('company_id', companyId)
    .eq('external_subject_id', identity.subjectId)
    .eq('external_issuer', identity.issuer)
    .maybeSingle()

  if (error) {
    if (isMissingExternalColumnError(error.message, error.code)) return null
    return { error: error.message }
  }

  if (!data) return null

  const orgUser = parseOrgUser(data.org_user_id as OrgUserRow | Array<OrgUserRow> | null)
  const resolvedEmail = orgUser?.email ?? ''

  return companyAccessFromRow(
    data,
    orgUser,
    companyId,
    organizationId,
    resolvedEmail,
  )
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
    if (byExternal?.companyUser) return byExternal
    if (byExternal?.error) {
      console.warn('[requireCompanyAccess] external identity lookup:', byExternal.error)
    }
  }

  const normalizedEmail = userEmail?.trim().toLowerCase() ?? null
  if (!normalizedEmail) return { error: 'No user email' }

  const supabase = createTenantClient()
  const { data, error } = await supabase
    .from('app_company_users')
    .select(
      `id, company_id, org_user_id!inner (id, email, first_name, last_name, profile_picture_url)`,
    )
    .eq('company_id', companyId)
    .eq('org_user_id.email', normalizedEmail)
    .maybeSingle()

  if (error) {
    console.warn('[requireCompanyAccess] tenant email lookup:', error.message)
  }

  if (data) {
    const orgUser = parseOrgUser(data.org_user_id as OrgUserRow | Array<OrgUserRow> | null)
    return companyAccessFromRow(
      data,
      orgUser,
      companyId,
      organizationId,
      normalizedEmail,
    )
  }

  // WorkOS Third-Party Auth: RLS uses auth.jwt()->>'email'; when the JWT
  // template omits email, fall back to a server-only service-role read.
  if (externalIdentity) {
    const byEmailAdmin = await requireCompanyAccessByEmailServiceRole(
      companyId,
      normalizedEmail,
      organizationId,
    )
    if (byEmailAdmin?.companyUser) return byEmailAdmin
  }

  return { error: 'No company membership found' }
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
