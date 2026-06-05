import { Outlet, createFileRoute } from '@tanstack/react-router'

import { PortalShell } from '@/features/company/components/portal-shell'
import { WmsSidebar } from '@/features/company/pages/wms/wms-sidebar'
import { allocationKeys } from '@/lib/data/orders/allocation/keys'
import { getAllocationOrdersList } from '@/lib/data/orders/allocation/server'
import { plmProductsListQuery } from '@/lib/data/plm/products/queries'
import { wmsKeys } from '@/lib/data/portal-bundles/wms/keys'
import { getWmsBundle } from '@/lib/data/portal-bundles/wms/server'

export const Route = createFileRoute('/$companySlug/_authed/wms')({
  // Prime every piece of data the WMS overview paints on first render
  // in one parallel fan-out on the server. Without this, the bundle
  // runs during SSR but `useAllocationOrders` / `usePlmProducts` in
  // the overview page don't kick off until after hydration, so the
  // client makes two extra round-trips that show up as render-blocking
  // skeletons and tank LCP.
  //
  // `staleTime: Infinity` in the hooks means once these three caches
  // land in the dehydrated payload, every child WMS route reads from
  // them until a mutation invalidates or the user reloads.
  //
  // Each prefetch is individually caught so one transient failure
  // (e.g. RLS mismatch on one of the tables) doesn't block the others
  // — the component's own hook will surface the error state inline.
  loader: async ({ context, params }) => {
    const companyId = (context as any).company?.companyId as string | undefined

    const bundle = context.queryClient
      .ensureQueryData({
        queryKey: wmsKeys.bundle(params.companySlug),
        queryFn: () =>
          getWmsBundle({ data: { companySlug: params.companySlug } }),
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[wms] bundle prefetch failed:', err)
        }
      })

    const allocations = companyId
      ? context.queryClient
          .ensureQueryData({
            queryKey: allocationKeys.list(companyId),
            queryFn: () => getAllocationOrdersList({ data: { companyId } }),
          })
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.warn('[wms] allocations prefetch failed:', err)
            }
          })
      : Promise.resolve()

    // `usePlmProducts` is now paginated — match the default page the
    // WMS overview page reads from (page 1, default pageSize) so the
    // prefetched cache entry is the one the child actually hits.
    const products = companyId
      ? context.queryClient
          .ensureQueryData(plmProductsListQuery(companyId, { page: 1 }))
          .catch((err) => {
            if (import.meta.env.DEV) {
              console.warn('[wms] products prefetch failed:', err)
            }
          })
      : Promise.resolve()

    await Promise.all([bundle, allocations, products])
  },
  component: WmsLayout,
})

function WmsLayout() {
  return (
    <PortalShell sidebar={<WmsSidebar />}>
      <Outlet />
    </PortalShell>
  )
}
