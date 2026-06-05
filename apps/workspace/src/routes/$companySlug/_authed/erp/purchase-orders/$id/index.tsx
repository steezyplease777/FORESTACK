import { createFileRoute } from '@tanstack/react-router'

import { PurchaseOrderDetailPage } from '@/features/company/pages/erp/purchase-order-detail-page'
import { purchaseOrderKeys } from '@/lib/data/erp/purchase-orders/keys'
import { getPurchaseOrder } from '@/lib/data/erp/purchase-orders/server'

export const Route = createFileRoute(
  '/$companySlug/_authed/erp/purchase-orders/$id/',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData({
      queryKey: purchaseOrderKeys.detail(params.id),
      queryFn: () => getPurchaseOrder({ data: { purchaseOrderId: params.id } }),
    }),
  component: PurchaseOrderDetailPage,
})
