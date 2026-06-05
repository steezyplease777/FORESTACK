import {
  Outlet,
  createFileRoute,
  notFound,
  redirect,
} from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import { CompanyProvider, type AuthUser } from '@/features/company/tenant-provider'
import { ThemeProvider } from '@/lib/theme/theme-provider'
import { resolveCompanyBySlug } from '@/lib/providers/tenant'
import {
  companyContextQueryKey,
  type CompanyUserProfile,
} from '@/lib/auth/tenant-context'
import { studioUrl, tenantUrl, whatPortal } from '@/lib/utils/domain-type'
import type { PortalTheme } from '@/lib/theme/types'

/**
 * Build a JSON Response for `/api/**` routes. Throwing a `Response` from a
 * `beforeLoad` short-circuits TanStack Start's server handler, which ships
 * the Response back to the caller verbatim - so XHR clients hitting a
 * tenant API get a proper `401`/`404` JSON body instead of the HTML
 * rendered by the router's default notFound/redirect handling.
 */
function apiJson(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Loads slug/host/company context for every tenant URL. This routeonly
 * surfaces data - auth + company-membership enforcement lives in the
 * pathless `_authed` layout. Public pages (login, access-denied, error,
 * auth/*) sit directly under `$companySlug/` and can render with whatever
 * data is available (may be unauthenticated).
 */
const loadCompanyContext = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { companySlug: string; pathname: string }) => data,
  )
  .handler(async ({ data }) => {
    const { createTenantClient } = await import(
      '@/lib/datasource/supabase/tenant-client.server'
    )
    const { requireCompanyAccess } = await import(
      '@/lib/auth/tenant-access.server'
    )
    const { getWorkOsAccessTokenFromCookies } = await import(
      '@/lib/auth/workos/session-cookie.server'
    )
    const { decodeWorkOsJwtClaims } = await import(
      '@/lib/auth/workos/jwt-claims'
    )

    const { companySlug, pathname } = data
    // Strip the slug-prefix the router prepends via `tenant-rewrite` so we
    // get the user-visible path back (e.g. `/fore-all/login` -> `/login`).
    const visiblePath = pathname.replace(`/${companySlug}`, '') || '/'
    const firstSegment = visiblePath.split('/').filter(Boolean)[0] ?? ''
    // Server routes under `api/**` enforce their own auth (401 JSON on
    // missing session). Surface a machine-readable 401/404 instead of an
    // HTML redirect for XHR callers.
    const isApiRoute = firstSegment === 'api'

    const request = getRequest()
    const host = request?.headers.get('host') ?? ''
    const portal = whatPortal(host)

    // Tenant host with the wrong slug -> back to studio. Short-circuit
    // before touching the DB for mismatched subdomains.
    if (portal.type === 'TENANT' && portal.sub !== companySlug) {
      if (isApiRoute) throw apiJson(404, { error: 'Tenant not found' })
      throw redirect({ href: studioUrl('/') })
    }

    // Validate the slug against the DB BEFORE any host-based redirects.
    // The `$companySlug` dynamic segment would otherwise swallow every
    // unknown top-level path on studio (e.g. `/random-typo`) and bounce it
    // to `random-typo.localhost:3000`.
    const company = await resolveCompanyBySlug(companySlug)
    if ('companyId' in company && company.companyId === null) {
      if (isApiRoute) throw apiJson(404, { error: 'Tenant not found' })
      throw notFound()
    }

    // Slug is real. If we're on studio, jump to the matching tenant host so
    // the user lands on the correct origin for their session cookies.
    if (portal.type === 'STUDIO') {
      if (isApiRoute) throw apiJson(404, { error: 'Not found on this host' })
      throw redirect({ href: tenantUrl(companySlug, visiblePath) })
    }

    const supabase = createTenantClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    // API routes still enforce auth at this layer to guarantee every
    // tenant-scoped API returns JSON 401 instead of HTML redirect.
    if (isApiRoute && !user) throw apiJson(401, { error: 'Unauthorized' })

    // Best-effort membership load. We don't redirect here - the `_authed`
    // layout does that. This lets public pages render while still making
    // the membership available to authed children via context.
    const workosToken = getWorkOsAccessTokenFromCookies()
    const workosClaims = workosToken
      ? decodeWorkOsJwtClaims(workosToken)
      : null
    const externalIdentity =
      workosClaims?.sub && workosClaims?.iss
        ? { subjectId: workosClaims.sub, issuer: workosClaims.iss }
        : null

    let companyUser: CompanyUserProfile | null = null
    if (user || externalIdentity) {
      const access = await requireCompanyAccess(
        company.companyId,
        user?.email ?? workosClaims?.email ?? null,
        company.organizationId,
        externalIdentity,
      )
      companyUser = access.companyUser ?? null
    }

    return {
      company,
      authUser: user
        ? ({
            id: user.id,
            email: user.email ?? null,
            name: (user.user_metadata as any)?.full_name ?? null,
            image: (user.user_metadata as any)?.avatar_url ?? null,
          } satisfies AuthUser)
        : null,
      userId: user?.id ?? null,
      companyUser,
    }
  })

const COMPANY_CONTEXT_STALE = 5 * 60 * 1000
const COMPANY_CONTEXT_GC = 30 * 60 * 1000

export const Route = createFileRoute('/$companySlug')({
  // The parent `beforeLoad` runs on every route transition (including search
  // param changes on child routes). The tenant context (host validation,
  // company lookup, auth user, membership) is stable for the duration of a
  // session, so we cache it via React Query keyed by slug. The first hit on
  // a tenant URL runs the full resolver (including any host-mismatch or
  // unauth redirects); every subsequent navigation within the same tenant
  // reads from cache and returns synchronously.
  beforeLoad: async ({ params, location, context }) => {
    const ctx = await context.queryClient.ensureQueryData({
      queryKey: companyContextQueryKey(params.companySlug),
      queryFn: () =>
        loadCompanyContext({
          data: {
            companySlug: params.companySlug,
            pathname: location.pathname,
          },
        }),
      staleTime: COMPANY_CONTEXT_STALE,
      gcTime: COMPANY_CONTEXT_GC,
    })
    return ctx
  },
  loader: ({ context }) => ({
    company: context.company,
    authUser: context.authUser,
    userId: context.userId,
    companyUser: context.companyUser,
  }),
  component: CompanyRoot,
})

function CompanyRoot() {
  const { companySlug } = Route.useParams()
  const { company, authUser, userId, companyUser } = Route.useLoaderData()
  const customThemeEnabled =
    'customThemePortal' in company ? (company.customThemePortal ?? false) : false
  const portalTheme =
    'portalTheme' in company ? (company.portalTheme as PortalTheme | null) : null
  return (
    <CompanyProvider
      companySlug={companySlug}
      company={company}
      userId={userId}
      authUser={authUser}
      companyUser={companyUser}
    >
      <ThemeProvider customThemeEnabled={customThemeEnabled} portalTheme={portalTheme}>
        <Outlet />
      </ThemeProvider>
    </CompanyProvider>
  )
}
