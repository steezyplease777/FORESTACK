import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Tenant-scoped authentication gate.
 *
 * Parent `$companySlug/route.tsx` loads the company + (optional) auth user
 * without forcing any redirects, so public routes like `/login` and
 * `/access-denied` can render with proper branding. This layout enforces the
 * actual auth + company-membership requirements for everything under
 * `_authed/*` (dashboard, erp, crm, wms, plm, pm, account, etc.).
 *
 * Any tenant route that should be protected belongs below this file.
 */

export const Route = createFileRoute('/$companySlug/_authed')({
  beforeLoad: ({ context, params }) => {
    const { userId, companyUser } = context as {
      userId?: string | null
      companyUser?: unknown
    }

    if (!userId) {
      throw redirect({
        to: '/$companySlug/login',
        params: { companySlug: params.companySlug },
      })
    }

    if (!companyUser) {
      throw redirect({
        to: '/$companySlug/access-denied',
        params: { companySlug: params.companySlug },
      })
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return <Outlet />
}
