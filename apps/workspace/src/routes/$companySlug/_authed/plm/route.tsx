import { Outlet, createFileRoute } from '@tanstack/react-router'

import { PortalShell } from '@/features/company/components/portal-shell'
import { PlmSidebar } from '@/features/company/pages/plm/plm-sidebar'
import { plmKeys } from '@/lib/data/portal-bundles/plm/keys'
import { getPlmBundle } from '@/lib/data/portal-bundles/plm/server'

export const Route = createFileRoute('/$companySlug/_authed/plm')({
  // Loader failures never crash the portal — see wms/route.tsx for
  // the rationale.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: plmKeys.bundle(params.companySlug),
        queryFn: () =>
          getPlmBundle({ data: { companySlug: params.companySlug } }),
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[plm] bundle prefetch failed:', err)
      }
    }
  },
  component: PlmLayout,
})

function PlmLayout() {
  return (
    <PortalShell sidebar={<PlmSidebar />}>
      <Outlet />
    </PortalShell>
  )
}
