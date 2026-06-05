import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'
import type { CompanyEditSnapshot } from '@/lib/data/company-editor/server'

export type OrgRole = 'ADMIN' | 'OWNER' | 'COMPANY'

export type MyOrganizationSummary = {
  id: string
  name: string
  slug: string | null
  logoUrl: string | null
  personalOrg: boolean
  role: OrgRole | null
  companyCount: number
  userCount: number
}

export type MyOrganizationDetail = MyOrganizationSummary & {
  createdAt: string
  /** The caller's `app_organization_users.id` within this org. */
  organizationUserId: string
  firstName: string | null
  lastName: string | null
  email: string
}

/**
 * Returns every organization the signed-in user is a member of (matched by
 * email on `app_organization_users`). Does a single grouped SELECT so we
 * don't N+1 on counts.
 */
export const listMyOrganizationsFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<MyOrganizationSummary>> => {
    const { supabase, user } = await requireAuthedSupabase()
    const email = user.email
    if (!email) return []

    const { data: memberships, error } = await supabase
      .from('app_organization_users')
      .select(
        'id, role, organization_id, app_organizations!inner ( id, name, slug, logo_url, personal_org, created_at )',
      )
      .eq('email', email)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)
    if (!memberships?.length) return []

    const orgIds = memberships
      .map((row: any) => row.organization_id as string)
      .filter(Boolean)

    // Bulk count companies + org-users per org in two queries rather than
    // N+1. Since we already selected org rows above, we know the full set.
    const [companyCountsRes, userCountsRes] = await Promise.all([
      supabase
        .from('app_companies')
        .select('organization_id', { count: 'exact' })
        .in('organization_id', orgIds),
      supabase
        .from('app_organization_users')
        .select('organization_id', { count: 'exact' })
        .in('organization_id', orgIds),
    ])
    if (companyCountsRes.error) throw new Error(companyCountsRes.error.message)
    if (userCountsRes.error) throw new Error(userCountsRes.error.message)

    const companyByOrg = new Map<string, number>()
    for (const row of companyCountsRes.data ?? []) {
      const k = (row as any).organization_id as string
      companyByOrg.set(k, (companyByOrg.get(k) ?? 0) + 1)
    }
    const usersByOrg = new Map<string, number>()
    for (const row of userCountsRes.data ?? []) {
      const k = (row as any).organization_id as string
      usersByOrg.set(k, (usersByOrg.get(k) ?? 0) + 1)
    }

    return memberships.map((row: any) => {
      const org = Array.isArray(row.app_organizations)
        ? row.app_organizations[0]
        : row.app_organizations
      return {
        id: org.id as string,
        name: org.name as string,
        slug: (org.slug as string | null) ?? null,
        logoUrl: (org.logo_url as string | null) ?? null,
        personalOrg: !!org.personal_org,
        role: (row.role as OrgRole | null) ?? null,
        companyCount: companyByOrg.get(org.id) ?? 0,
        userCount: usersByOrg.get(org.id) ?? 0,
      }
    })
  },
)

/**
 * Loads a single organization by id AND verifies the caller is a SaaS-level
 * member (OWNER or ADMIN) of it. Returns `null` for non-members OR for
 * COMPANY-only members - both are access-denied signals route guards treat
 * as 404 so we don't leak whether the org exists.
 *
 * This is the DB-side counterpart to the `saas_orgs` JWT claim: both sides
 * must agree that a user is allowed in, and the DB is the ultimate source
 * of truth if the claim is stale or hasn't been populated yet (e.g. the
 * user's token predates the Custom Access Token Hook being enabled).
 */
export const getMyOrganizationFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { orgId: string }) => {
    if (!data.orgId) throw new Error('orgId is required')
    return data
  })
  .handler(
    async ({ data }): Promise<MyOrganizationDetail | null> => {
      const { supabase, user } = await requireAuthedSupabase()
      const email = user.email
      if (!email) return null

      // Membership + org in one query: `!inner` keeps the join required so
      // non-members get zero rows back. `.in('role', ...)` excludes
      // COMPANY-only members so they bounce out of the SaaS portal even if
      // they hand-crafted a URL.
      const { data: row, error } = await supabase
        .from('app_organization_users')
        .select(
          'id, role, first_name, last_name, email, app_organizations!inner ( id, name, slug, logo_url, personal_org, created_at )',
        )
        .eq('email', email)
        .eq('organization_id', data.orgId)
        .in('role', ['OWNER', 'ADMIN'])
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!row) return null

      const org = Array.isArray((row as any).app_organizations)
        ? (row as any).app_organizations[0]
        : (row as any).app_organizations

      const [companyCountRes, userCountRes] = await Promise.all([
        supabase
          .from('app_companies')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', data.orgId),
        supabase
          .from('app_organization_users')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', data.orgId),
      ])

      return {
        id: org.id as string,
        name: org.name as string,
        slug: (org.slug as string | null) ?? null,
        logoUrl: (org.logo_url as string | null) ?? null,
        personalOrg: !!org.personal_org,
        createdAt: org.created_at as string,
        organizationUserId: (row as any).id as string,
        firstName: ((row as any).first_name as string | null) ?? null,
        lastName: ((row as any).last_name as string | null) ?? null,
        email: (row as any).email as string,
        role: ((row as any).role as OrgRole | null) ?? null,
        companyCount: companyCountRes.count ?? 0,
        userCount: userCountRes.count ?? 0,
      }
    },
  )

/**
 * Lists companies in an org AND returns the full edit-snapshot for each
 * one in a single round trip.  The company-settings dialog reads from
 * the detail cache seeded by this response, which makes "click a kebab
 * menu → modal opens fully hydrated" instant - zero network hop between
 * click and paint.
 *
 * Query count is O(1) regardless of company count:
 *   1. Caller's org membership  (also yields viewer role + org_user_id)
 *   2. All companies in the org
 *   3. All company-users across those companies (`.in(company_id)`)
 *   4. All departments across those companies
 *   5. All department titles across those companies
 * RLS filters every read so this handler doesn't re-authorise anything
 * beyond the initial membership gate.
 */
export const listOrgCompaniesFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { orgId: string }) => data)
  .handler(async ({ data }): Promise<Array<CompanyEditSnapshot>> => {
    const { supabase, user } = await requireAuthedSupabase()
    const email = user.email
    if (!email) return []

    // Caller's org membership tells us (a) whether they can even see
    // this org and (b) the viewer role to stamp on every snapshot.
    // Viewer role is org-wide, not per-company, so fetching once is
    // enough - every snapshot will inherit it.
    const { data: membership } = await supabase
      .from('app_organization_users')
      .select('id, role')
      .eq('email', email)
      .eq('organization_id', data.orgId)
      .maybeSingle()
    if (!membership) throw new Error('Not a member of this organization')
    const viewerOrgUserId = (membership as any).id as string
    const viewerRole = (membership as any).role as OrgRole | null
    const viewerIsAdmin = viewerRole === 'OWNER' || viewerRole === 'ADMIN'

    const { data: companyRows, error: cErr } = await supabase
      .from('app_companies')
      .select(
        'id, name, slug, logo_url, website_url, primary_color_hex, secondary_color_hex, created_at, organization_id',
      )
      .eq('organization_id', data.orgId)
      .order('created_at', { ascending: true })
    if (cErr) throw new Error(cErr.message)
    const companies = companyRows ?? []
    if (companies.length === 0) return []
    const companyIds = companies.map((c: any) => c.id as string)

    // Members, departments, titles for ALL companies in one query each.
    // Grouping happens client-side in the maps below - cheap since every
    // row carries the company_id foreign key.
    const [membersRes, deptRes, titleRes] = await Promise.all([
      supabase
        .from('app_company_users')
        .select(
          `id, created_at, company_id, department_title_id,
           org_user_id ( id, email, first_name, last_name, role, profile_picture_url ),
           department_title_id ( id, name )`,
        )
        .in('company_id', companyIds)
        .order('created_at', { ascending: true }),
      supabase
        .from('app_company_departments')
        .select('id, name, description, created_at, company_id')
        .in('company_id', companyIds)
        .order('name', { ascending: true }),
      supabase
        .from('app_company_department_titles')
        .select('id, department_id, name, description, created_at, company_id')
        .in('company_id', companyIds)
        .order('name', { ascending: true }),
    ])
    if (membersRes.error) throw new Error(membersRes.error.message)
    if (deptRes.error) throw new Error(deptRes.error.message)
    if (titleRes.error) throw new Error(titleRes.error.message)

    // Bucket per company so the per-snapshot assembly is O(1) per row.
    const membersByCompany = new Map<string, CompanyEditSnapshot['members']>()
    for (const row of membersRes.data ?? []) {
      const r = row as any
      const ou = Array.isArray(r.org_user_id) ? r.org_user_id[0] : r.org_user_id
      const dt = Array.isArray(r.department_title_id)
        ? r.department_title_id[0]
        : r.department_title_id
      const entry = {
        companyUserId: r.id as string,
        orgUserId: ou?.id as string,
        email: (ou?.email as string) ?? '',
        firstName: (ou?.first_name as string | null) ?? null,
        lastName: (ou?.last_name as string | null) ?? null,
        profilePictureUrl: (ou?.profile_picture_url as string | null) ?? null,
        role: (ou?.role as OrgRole | null) ?? null,
        departmentTitleId: (dt?.id as string | null) ?? null,
        departmentTitleName: (dt?.name as string | null) ?? null,
        createdAt: r.created_at as string,
      }
      const arr = membersByCompany.get(r.company_id as string) ?? []
      arr.push(entry)
      membersByCompany.set(r.company_id as string, arr)
    }

    const deptsByCompany = new Map<string, CompanyEditSnapshot['departments']>()
    for (const row of deptRes.data ?? []) {
      const r = row as any
      const arr = deptsByCompany.get(r.company_id as string) ?? []
      arr.push({
        id: r.id as string,
        name: r.name as string,
        description: (r.description as string | null) ?? null,
        createdAt: r.created_at as string,
      })
      deptsByCompany.set(r.company_id as string, arr)
    }

    const titlesByCompany = new Map<string, CompanyEditSnapshot['titles']>()
    for (const row of titleRes.data ?? []) {
      const r = row as any
      const arr = titlesByCompany.get(r.company_id as string) ?? []
      arr.push({
        id: r.id as string,
        departmentId: r.department_id as string,
        name: r.name as string,
        description: (r.description as string | null) ?? null,
        createdAt: r.created_at as string,
      })
      titlesByCompany.set(r.company_id as string, arr)
    }

    return companies.map((c: any): CompanyEditSnapshot => ({
      company: {
        id: c.id as string,
        name: c.name as string,
        slug: (c.slug as string | null) ?? null,
        logoUrl: (c.logo_url as string | null) ?? null,
        websiteUrl: (c.website_url as string | null) ?? null,
        primaryColorHex: (c.primary_color_hex as string | null) ?? null,
        secondaryColorHex: (c.secondary_color_hex as string | null) ?? null,
        createdAt: c.created_at as string,
        organizationId: c.organization_id as string,
      },
      viewerIsAdmin,
      viewerOrgUserId,
      members: membersByCompany.get(c.id as string) ?? [],
      departments: deptsByCompany.get(c.id as string) ?? [],
      titles: titlesByCompany.get(c.id as string) ?? [],
    }))
  })

/**
 * Owner-only edit of the workspace-identity fields (name + logo URL).
 * Backed by the `update_organization_basics` SECURITY DEFINER RPC so the
 * OWNER check runs in the DB and we can't accidentally ship a write that
 * an ADMIN could exploit through a direct PATCH.
 *
 * Pass `logoUrl: ''` to clear the column; `undefined` leaves it alone.
 */
export const updateOrganizationBasicsFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { orgId: string; name?: string; logoUrl?: string | null }) => {
      if (!data.orgId) throw new Error('orgId is required')
      if (data.name !== undefined) {
        const trimmed = data.name.trim()
        if (trimmed.length < 1) throw new Error('Workspace name is required')
        return { ...data, name: trimmed }
      }
      return data
    },
  )
  .handler(async ({ data }): Promise<MyOrganizationDetail> => {
    const { supabase } = await requireAuthedSupabase()
    const { error } = await supabase.rpc('update_organization_basics', {
      p_org_id: data.orgId,
      p_name: data.name ?? null,
      // empty string clears the column; null leaves it alone
      p_logo_url: data.logoUrl === undefined ? null : data.logoUrl ?? '',
    })
    if (error) {
      const msg = error.message ?? ''
      if (msg.includes('not_org_owner')) {
        throw new Error('Only the workspace owner can edit these settings.')
      }
      if (msg.includes('name_required')) {
        throw new Error('Workspace name is required')
      }
      if (msg.includes('organization_not_found')) {
        throw new Error('Workspace not found')
      }
      throw new Error(msg || 'Failed to update workspace')
    }
    // Re-fetch through the authenticated handler so the caller gets the
    // fresh, RLS-filtered detail row with counts + viewer metadata.
    const fresh = await getMyOrganizationFn({ data: { orgId: data.orgId } })
    if (!fresh) throw new Error('Workspace not found')
    return fresh
  })

export type OrgUserSummary = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: OrgRole | null
  profilePictureUrl: string | null
  createdAt: string
  /**
   * Last successful Supabase auth sign-in for this user's email.
   * `null` means the user has been invited but never completed a
   * sign-in (or their auth row was deleted). Pulled from
   * `auth.users.last_sign_in_at` via the
   * `list_org_users_with_last_sign_in` SECURITY DEFINER RPC — we
   * can't read `auth.users` directly under RLS.
   */
  lastSignInAt: string | null
}

export type CreateOrgUserInput = {
  orgId: string
  email: string
  role?: OrgRole
  firstName?: string
  lastName?: string
}

/**
 * Creates a new `app_organization_users` row in `orgId`.  Delegates to
 * `public.create_org_user` so admin-gating, email normalisation and the
 * "only owners can mint owners" rule all live next to the data.
 *
 * Returns the freshly inserted row in the same shape as
 * `listOrgUsersFn`, so callers can splice it directly into the list
 * cache without a refetch.
 */
export const createOrgUserFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateOrgUserInput) => {
    const orgId = data.orgId?.trim()
    const email = data.email?.trim()
    if (!orgId) throw new Error('orgId is required')
    if (!email) throw new Error('Email is required')
    return {
      orgId,
      email,
      role: data.role,
      firstName: data.firstName?.trim() || undefined,
      lastName: data.lastName?.trim() || undefined,
    }
  })
  .handler(async ({ data }): Promise<OrgUserSummary> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase.rpc('create_org_user', {
      p_org_id: data.orgId,
      p_email: data.email,
      p_role: data.role ?? 'COMPANY',
      p_first_name: data.firstName ?? null,
      p_last_name: data.lastName ?? null,
    })
    if (error) {
      // SQLSTATE-coded errors from the RPC surface through
      // `error.message`; translate the ones we expect so callers get
      // human copy and keep the raw message for unexpected paths.
      const msg = error.message ?? ''
      if (msg.includes('not_authenticated')) {
        throw new Error('You must be signed in.')
      }
      if (msg.includes('invalid_email')) {
        throw new Error('Enter a valid email address.')
      }
      if (msg.includes('insufficient_privileges')) {
        throw new Error('Only owners and admins can invite members.')
      }
      if (msg.includes('owner_role_requires_owner')) {
        throw new Error('Only owners can grant the OWNER role.')
      }
      if (msg.includes('email_taken')) {
        throw new Error('That email is already in this organization.')
      }
      throw new Error(msg || 'Failed to create user')
    }
    const row = Array.isArray(rows) ? rows[0] : (rows as any)
    if (!row?.id) throw new Error('Create returned no row')
    return {
      id: row.id as string,
      email: row.email as string,
      firstName: (row.first_name as string | null) ?? null,
      lastName: (row.last_name as string | null) ?? null,
      role: (row.role as OrgRole | null) ?? null,
      profilePictureUrl: (row.profile_picture_url as string | null) ?? null,
      createdAt: row.created_at as string,
      // A freshly invited row has no auth session yet.
      lastSignInAt: null,
    }
  })

/**
 * Lists every member of `orgId` along with their most recent Supabase
 * auth sign-in.  Uses the `list_org_users_with_last_sign_in`
 * SECURITY DEFINER RPC because `auth.users.last_sign_in_at` isn't
 * reachable through RLS — the function checks membership against the
 * caller's JWT email before joining `auth.users` on `lower(email)`.
 */
export const listOrgUsersFn = createServerFn({ method: 'GET' })
  .inputValidator((data: { orgId: string }) => data)
  .handler(async ({ data }): Promise<Array<OrgUserSummary>> => {
    const { supabase } = await requireAuthedSupabase()

    const { data: rows, error } = await supabase.rpc(
      'list_org_users_with_last_sign_in',
      { p_org_id: data.orgId },
    )
    if (error) {
      const msg = error.message ?? ''
      if (msg.includes('not_authenticated')) {
        throw new Error('You must be signed in.')
      }
      if (msg.includes('not_org_member')) {
        throw new Error('Not a member of this organization')
      }
      throw new Error(msg || 'Failed to load members')
    }

    return (rows ?? []).map((r: any) => ({
      id: r.id as string,
      email: r.email as string,
      firstName: (r.first_name as string | null) ?? null,
      lastName: (r.last_name as string | null) ?? null,
      role: (r.role as OrgRole | null) ?? null,
      profilePictureUrl: (r.profile_picture_url as string | null) ?? null,
      createdAt: r.created_at as string,
      lastSignInAt: (r.last_sign_in_at as string | null) ?? null,
    }))
  })

/**
 * Creates a new company under `orgId`. Delegates to
 * `public.create_org_company` so slug generation, role check
 * (OWNER/ADMIN only), and the company_users self-attachment happen in a
 * single transaction. Returns the new company id + slug for the UI to
 * redirect into.
 */
export type CreateOrgCompanyInput = { orgId: string; name: string; slug?: string }
export type CreateOrgCompanyResult = { id: string; slug: string }

export const createOrgCompanyFn = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateOrgCompanyInput) => {
    const orgId = data.orgId?.trim()
    const name = data.name?.trim()
    const slug = data.slug?.trim() || undefined
    if (!orgId) throw new Error('orgId is required')
    if (!name || name.length < 2) throw new Error('Company name is required')
    return { orgId, name, slug }
  })
  .handler(async ({ data }): Promise<CreateOrgCompanyResult> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase.rpc('create_org_company', {
      p_org_id: data.orgId,
      p_name: data.name,
      p_slug: data.slug ?? null,
    })
    if (error) {
      if (error.message.includes('insufficient_privileges')) {
        throw new Error('You need to be an owner or admin to add a company.')
      }
      if (error.message.includes('not_authenticated')) {
        throw new Error('You must be signed in.')
      }
      if (error.message.includes('invalid_company_name')) {
        throw new Error('Company name must be at least 2 characters.')
      }
      throw new Error(error.message)
    }
    // `returns table` surfaces an array in PostgREST; take the first row.
    const row = Array.isArray(rows) ? rows[0] : (rows as any)
    if (!row?.id || !row?.slug) throw new Error('Company creation returned no row')
    return { id: row.id as string, slug: row.slug as string }
  })
