import { Outlet, createFileRoute } from '@tanstack/react-router'

import { PortalShell } from '@/features/company/components/portal-shell'
import { PmSidebar } from '@/features/company/pages/pm/pm-sidebar'
import { pmKeys } from '@/lib/data/portal-bundles/pm/keys'
import { getPmBundle } from '@/lib/data/portal-bundles/pm/server'

export const Route = createFileRoute('/$companySlug/_authed/pm')({
  // Loader failures never crash the portal — see wms/route.tsx for
  // the rationale.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: pmKeys.bundle(params.companySlug),
        queryFn: () =>
          getPmBundle({ data: { companySlug: params.companySlug } }),
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[pm] bundle prefetch failed:', err)
      }
    }
  },
  component: PmLayout,
})

function PmLayout() {
  return (
    <PortalShell sidebar={<PmSidebar />}>
      <Outlet />
    </PortalShell>
  )
}
