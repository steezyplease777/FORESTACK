import { createFileRoute } from '@tanstack/react-router'

import { PlmProductDetailPage } from '@/features/company/pages/plm/products/plm-product-detail-page'
import { plmProductDetailQuery } from '@/lib/data/plm/products/queries'
import { plmSourcingByStyleQuery } from '@/lib/data/plm/sourcing/queries'

export const Route = createFileRoute(
  '/$companySlug/_authed/plm/products/$productId',
)({
  loader: async ({ context, params }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    // Load the product first so the rest of the prefetch can use the
    // style_id to warm the "sourcing options for this style" query
    // that the Sourcing tab shows.
    const product = await context.queryClient.ensureQueryData(
      plmProductDetailQuery(companyId, params.productId),
    )
    const styleId = product?.style_id
    if (styleId) {
      await context.queryClient.ensureQueryData(
        plmSourcingByStyleQuery(companyId, styleId),
      )
    }
  },
  component: PlmProductDetailPage,
})
