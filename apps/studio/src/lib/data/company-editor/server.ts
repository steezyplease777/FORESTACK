import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import type { OrgRole } from '@/lib/data/organizations/server'

type SupabaseClient = Awaited<
  ReturnType<typeof requireAuthedSupabase>
>['supabase']

/**
 * Company-editor data layer. Every read is filtered by RLS so a user who
 * isn't a member of the parent org gets zero rows back - no need for the
 * handlers to re-check membership. Every mutation delegates to a
 * SECURITY DEFINER RPC so the role gate (OWNER/ADMIN of parent org) is
 * enforced in one place.
 */

export type CompanyEditSnapshot = {
  company: {
    id: string
    name: string
    slug: string | null
    logoUrl: string | null
    websiteUrl: string | null
    primaryColorHex: string | null
    secondaryColorHex: string | null
    createdAt: string
    organizationId: string
  }
  viewerIsAdmin: boolean
  viewerOrgUserId: string | null
  members: Array<{
    companyUserId: string
    orgUserId: string
    email: string
    firstName: string | null
    lastName: string | null
    profilePictureUrl: string | null
    role: OrgRole | null
    departmentTitleId: string | null
    departmentTitleName: string | null
    createdAt: string
  }>
  departments: Array<{
    id: string
    name: string
    description: string | null
    createdAt: string
  }>
  titles: Array<{
    id: string
    departmentId: string
    name: string
    description: string | null
    createdAt: string
  }>
}

/**
 * Load the full editor snapshot for a single company.
 *
 * Extracted so every mutation can return a fresh snapshot in the same
 * HTTP round trip as the write - the client then writes that response
 * into both the detail cache AND the matching list entry without any
 * follow-up refetch. One mutation = one network request, end to end.
 */
async function loadCompanyEditSnapshot(
  supabase: SupabaseClient,
  email: string | null,
  companyId: string,
): Promise<CompanyEditSnapshot> {
  const { data: companyRow, error: cErr } = await supabase
    .from('app_companies')
    .select(
      'id, name, slug, logo_url, website_url, primary_color_hex, secondary_color_hex, created_at, organization_id',
    )
    .eq('id', companyId)
    .maybeSingle()
  if (cErr) throw new Error(cErr.message)
  if (!companyRow) throw new Error('Company not found or access denied')

  let viewerOrgUserId: string | null = null
  let viewerIsAdmin = false
  if (email) {
    const { data: orgUser } = await supabase
      .from('app_organization_users')
      .select('id, role')
      .eq('email', email)
      .eq('organization_id', companyRow.organization_id)
      .maybeSingle()
    if (orgUser) {
      viewerOrgUserId = (orgUser as any).id as string
      const role = (orgUser as any).role as OrgRole | null
      viewerIsAdmin = role === 'OWNER' || role === 'ADMIN'
    }
  }

  const [membersRes, deptRes, titleRes] = await Promise.all([
    supabase
      .from('app_company_users')
      .select(
        `id, created_at, department_title_id,
         org_user_id ( id, email, first_name, last_name, role, profile_picture_url ),
         department_title_id ( id, name )`,
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: true }),
    supabase
      .from('app_company_departments')
      .select('id, name, description, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true }),
    supabase
      .from('app_company_department_titles')
      .select('id, department_id, name, description, created_at')
      .eq('company_id', companyId)
      .order('name', { ascending: true }),
  ])
  if (membersRes.error) throw new Error(membersRes.error.message)
  if (deptRes.error) throw new Error(deptRes.error.message)
  if (titleRes.error) throw new Error(titleRes.error.message)

  const members = (membersRes.data ?? []).map((row: any) => {
    const ou = Array.isArray(row.org_user_id) ? row.org_user_id[0] : row.org_user_id
    const dt = Array.isArray(row.department_title_id)
      ? row.department_title_id[0]
      : row.department_title_id
    return {
      companyUserId: row.id as string,
      orgUserId: ou?.id as string,
      email: (ou?.email as string) ?? '',
      firstName: (ou?.first_name as string | null) ?? null,
      lastName: (ou?.last_name as string | null) ?? null,
      profilePictureUrl: (ou?.profile_picture_url as string | null) ?? null,
      role: (ou?.role as OrgRole | null) ?? null,
      departmentTitleId: (dt?.id as string | null) ?? null,
      departmentTitleName: (dt?.name as string | null) ?? null,
      createdAt: row.created_at as string,
    }
  })

  return {
    company: {
      id: companyRow.id as string,
      name: companyRow.name as string,
      slug: (companyRow.slug as string | null) ?? null,
      logoUrl: (companyRow.logo_url as string | null) ?? null,
      websiteUrl: (companyRow.website_url as string | null) ?? null,
      primaryColorHex: (companyRow.primary_color_hex as string | null) ?? null,
      secondaryColorHex:
        (companyRow.secondary_color_hex as string | null) ?? null,
      createdAt: companyRow.created_at as string,
      organizationId: companyRow.organization_id as string,
    },
    viewerIsAdmin,
    viewerOrgUserId,
    members,
    departments: (deptRes.data ?? []).map((d: any) => ({
      id: d.id as string,
      name: d.name as string,
      description: (d.description as string | null) ?? null,
      createdAt: d.created_at as string,
    })),
    titles: (titleRes.data ?? []).map((t: any) => ({
      id: t.id as string,
      departmentId: t.department_id as string,
      name: t.name as string,
      description: (t.description as string | null) ?? null,
      createdAt: t.created_at as string,
    })),
  }
}

export const getCompanyEditSnapshotFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => {
    if (!data.companyId) throw new Error('companyId required')
    return data
  })
  .handler(async ({ data }): Promise<CompanyEditSnapshot> => {
    const { supabase, user } = await requireAuthedSupabase()
    return loadCompanyEditSnapshot(supabase, user.email ?? null, data.companyId)
  })

// -- mutations --------------------------------------------------------
// All delegate to SECURITY DEFINER RPCs; the RPC enforces the role gate
// and the ambiguity between "you aren't allowed" vs "row doesn't exist"
// is surfaced with distinct SQLSTATE codes so the UI can speak plainly.

function translate(err: { message: string }): Error {
  const m = err.message
  if (m.includes('insufficient_privileges'))
    return new Error('You need owner or admin access to do this.')
  if (m.includes('not_authenticated')) return new Error('Please sign in again.')
  if (m.includes('cannot_remove_last_member'))
    return new Error(
      'This is the last member of the company. Add another member first or delete the company.',
    )
  if (m.includes('department_company_mismatch'))
    return new Error('That department does not belong to this company.')
  if (m.includes('title_company_mismatch'))
    return new Error('That title does not belong to this company.')
  if (m.includes('invalid_email'))
    return new Error('Enter a valid email address.')
  if (m.includes('company_not_found') || m.includes('not_found'))
    return new Error('Record not found.')
  if (m.includes('invalid_company_name') || m.includes('invalid_name'))
    return new Error('Name is required.')
  return new Error(m)
}

/**
 * Every mutation returns the post-mutation `CompanyEditSnapshot` for
 * the affected company. One HTTP round trip gives us both the write
 * AND the fresh read - the client writes the response into the detail
 * cache and the matching list entry, so the modal + list row update
 * without a follow-up refetch.
 *
 * Helper: run the RPC, then re-read the snapshot with the SAME supabase
 * client (so RLS is evaluated as the caller, not the definer).
 */
async function mutateAndReturnSnapshot(
  companyId: string,
  run: (supabase: SupabaseClient) => Promise<void>,
): Promise<CompanyEditSnapshot> {
  const { supabase, user } = await requireAuthedSupabase()
  await run(supabase)
  return loadCompanyEditSnapshot(supabase, user.email ?? null, companyId)
}

/**
 * `remove_company_member` and `delete_company_department(_title)` take
 * a row id, not a company id.  Look up the parent company first so we
 * can return the right snapshot afterwards.  These helper queries are
 * under RLS, so the caller must be able to SELECT the row to mutate it
 * anyway - no extra permission surface.
 */
async function companyIdForCompanyUser(
  supabase: SupabaseClient,
  companyUserId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('app_company_users')
    .select('company_id')
    .eq('id', companyUserId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Record not found.')
  return (data as any).company_id as string
}

async function companyIdForDepartment(
  supabase: SupabaseClient,
  departmentId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('app_company_departments')
    .select('company_id')
    .eq('id', departmentId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Record not found.')
  return (data as any).company_id as string
}

async function companyIdForTitle(
  supabase: SupabaseClient,
  titleId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('app_company_department_titles')
    .select('company_id')
    .eq('id', titleId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Record not found.')
  return (data as any).company_id as string
}

export const updateCompanyFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      companyId: string
      name?: string
      logoUrl?: string | null
      websiteUrl?: string | null
      primaryColorHex?: string | null
      secondaryColorHex?: string | null
    }) => {
      if (!data.companyId) throw new Error('companyId required')
      return data
    },
  )
  .handler(
    async ({ data }): Promise<CompanyEditSnapshot> =>
      mutateAndReturnSnapshot(data.companyId, async (supabase) => {
        const { error } = await supabase.rpc('update_company', {
          p_company_id: data.companyId,
          p_name: data.name ?? null,
          // empty string clears the column; undefined leaves it alone.
          p_logo_url: data.logoUrl === undefined ? null : data.logoUrl ?? '',
          p_website_url:
            data.websiteUrl === undefined ? null : data.websiteUrl ?? '',
          p_primary_color_hex:
            data.primaryColorHex === undefined
              ? null
              : data.primaryColorHex ?? '',
          p_secondary_color_hex:
            data.secondaryColorHex === undefined
              ? null
              : data.secondaryColorHex ?? '',
        })
        if (error) throw translate(error)
      }),
  )

export const createDepartmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { companyId: string; name: string; description?: string }) => data,
  )
  .handler(
    async ({ data }): Promise<CompanyEditSnapshot> =>
      mutateAndReturnSnapshot(data.companyId, async (supabase) => {
        const { error } = await supabase.rpc('create_company_department', {
          p_company_id: data.companyId,
          p_name: data.name,
          p_description: data.description ?? null,
        })
        if (error) throw translate(error)
      }),
  )

/**
 * Rename (and/or retitle the description of) an existing department.
 * Passing `description: undefined` leaves the column untouched; passing
 * an empty string clears it.  The RPC owns both conventions so the UI
 * doesn't need to read-then-write.
 */
export const updateDepartmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      departmentId: string
      name: string
      description?: string | null
    }) => {
      if (!data.departmentId) throw new Error('departmentId required')
      if (!data.name || !data.name.trim()) throw new Error('Name is required')
      return data
    },
  )
  .handler(async ({ data }): Promise<CompanyEditSnapshot> => {
    const { supabase, user } = await requireAuthedSupabase()
    const companyId = await companyIdForDepartment(supabase, data.departmentId)
    const { error } = await supabase.rpc('update_company_department', {
      p_department_id: data.departmentId,
      p_name: data.name,
      // undefined → null (leave alone); '' stays '' (clear)
      p_description: data.description ?? null,
    })
    if (error) throw translate(error)
    return loadCompanyEditSnapshot(supabase, user.email ?? null, companyId)
  })

export const deleteDepartmentFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { departmentId: string }) => data)
  .handler(async ({ data }): Promise<CompanyEditSnapshot> => {
    const { supabase, user } = await requireAuthedSupabase()
    const companyId = await companyIdForDepartment(supabase, data.departmentId)
    const { error } = await supabase.rpc('delete_company_department', {
      p_department_id: data.departmentId,
    })
    if (error) throw translate(error)
    return loadCompanyEditSnapshot(supabase, user.email ?? null, companyId)
  })

export const createTitleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      companyId: string
      departmentId: string
      name: string
      description?: string
    }) => data,
  )
  .handler(
    async ({ data }): Promise<CompanyEditSnapshot> =>
      mutateAndReturnSnapshot(data.companyId, async (supabase) => {
        const { error } = await supabase.rpc(
          'create_company_department_title',
          {
            p_company_id: data.companyId,
            p_department_id: data.departmentId,
            p_name: data.name,
            p_description: data.description ?? null,
          },
        )
        if (error) throw translate(error)
      }),
  )

export const deleteTitleFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { titleId: string }) => data)
  .handler(async ({ data }): Promise<CompanyEditSnapshot> => {
    const { supabase, user } = await requireAuthedSupabase()
    const companyId = await companyIdForTitle(supabase, data.titleId)
    const { error } = await supabase.rpc('delete_company_department_title', {
      p_title_id: data.titleId,
    })
    if (error) throw translate(error)
    return loadCompanyEditSnapshot(supabase, user.email ?? null, companyId)
  })

/**
 * Add a member to a company.  If the email isn't already an org user
 * inside the company's parent org, a new `app_organization_users` row
 * is created first (role defaults to COMPANY) and then attached.  The
 * underlying RPC is idempotent on (company_id, org_user_id), so
 * re-adding an existing member is safe and can optionally update their
 * department title assignment.
 */
export const addCompanyMemberFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      companyId: string
      email: string
      firstName?: string
      lastName?: string
      departmentTitleId?: string | null
    }) => {
      if (!data.companyId) throw new Error('companyId required')
      if (!data.email || !data.email.trim())
        throw new Error('Email is required')
      return data
    },
  )
  .handler(
    async ({ data }): Promise<CompanyEditSnapshot> =>
      mutateAndReturnSnapshot(data.companyId, async (supabase) => {
        const { error } = await supabase.rpc('add_company_member', {
          p_company_id: data.companyId,
          p_email: data.email.trim(),
          p_first_name: data.firstName?.trim() || null,
          p_last_name: data.lastName?.trim() || null,
          p_department_title_id: data.departmentTitleId ?? null,
        })
        if (error) throw translate(error)
      }),
  )

/**
 * Re-assigns (or unsets) the department title on an existing company
 * member.  The tenant's "department" concept is derived from the
 * title's parent department, so this is the primitive that "adds a
 * member to a department" (pick a title in that department) or
 * "removes them from a department" (pass null).  The member stays in
 * the company either way - use `removeCompanyMemberFn` to drop them
 * entirely.
 */
export const setCompanyMemberTitleFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { companyUserId: string; departmentTitleId: string | null }) => {
      if (!data.companyUserId) throw new Error('companyUserId required')
      return data
    },
  )
  .handler(async ({ data }): Promise<CompanyEditSnapshot> => {
    const { supabase, user } = await requireAuthedSupabase()
    const companyId = await companyIdForCompanyUser(
      supabase,
      data.companyUserId,
    )
    const { error } = await supabase.rpc('set_company_member_title', {
      p_company_user_id: data.companyUserId,
      p_department_title_id: data.departmentTitleId,
    })
    if (error) throw translate(error)
    return loadCompanyEditSnapshot(supabase, user.email ?? null, companyId)
  })

export const removeCompanyMemberFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { companyUserId: string }) => data)
  .handler(async ({ data }): Promise<CompanyEditSnapshot> => {
    const { supabase, user } = await requireAuthedSupabase()
    const companyId = await companyIdForCompanyUser(
      supabase,
      data.companyUserId,
    )
    const { error } = await supabase.rpc('remove_company_member', {
      p_company_user_id: data.companyUserId,
    })
    if (error) throw translate(error)
    return loadCompanyEditSnapshot(supabase, user.email ?? null, companyId)
  })
