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

/** External IdP identity for Third-Party Auth membership matching. */
export type ExternalIdentity = {
  subjectId: string
  issuer: string
}

export function companyContextQueryKey(companySlug: string) {
  return ['companyContext', companySlug] as const
}
