import { Outlet, createFileRoute } from '@tanstack/react-router'

import { PortalShell } from '@/features/company/components/portal-shell'
import { ErpSidebar } from '@/features/company/pages/erp/erp-sidebar'
import { erpKeys } from '@/lib/data/portal-bundles/erp/keys'
import { getErpBundle } from '@/lib/data/portal-bundles/erp/server'

export const Route = createFileRoute('/$companySlug/_authed/erp')({
  // Loader failures never crash the portal — see wms/route.tsx for
  // the rationale.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: erpKeys.bundle(params.companySlug),
        queryFn: () =>
          getErpBundle({ data: { companySlug: params.companySlug } }),
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[erp] bundle prefetch failed:', err)
      }
    }
  },
  component: ErpLayout,
})

function ErpLayout() {
  return (
    <PortalShell sidebar={<ErpSidebar />}>
      <Outlet />
    </PortalShell>
  )
}
