import { Outlet, createFileRoute } from '@tanstack/react-router'

import { PortalShell } from '@/features/company/components/portal-shell'
import { CrmSidebar } from '@/features/company/pages/crm/crm-sidebar'
import { crmKeys } from '@/lib/data/portal-bundles/crm/keys'
import { getCrmBundle } from '@/lib/data/portal-bundles/crm/server'

export const Route = createFileRoute('/$companySlug/_authed/crm')({
  // Loader failures never crash the portal — see wms/route.tsx for
  // the rationale.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: crmKeys.bundle(params.companySlug),
        queryFn: () =>
          getCrmBundle({ data: { companySlug: params.companySlug } }),
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[crm] bundle prefetch failed:', err)
      }
    }
  },
  component: CrmLayout,
})

function CrmLayout() {
  return (
    <PortalShell sidebar={<CrmSidebar />}>
      <Outlet />
    </PortalShell>
  )
}
