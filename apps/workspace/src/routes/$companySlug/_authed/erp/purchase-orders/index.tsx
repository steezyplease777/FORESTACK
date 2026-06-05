import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PurchaseOrdersPage } from '@/features/company/pages/erp/purchase-orders-page'
import { purchaseOrderKeys } from '@/lib/data/erp/purchase-orders/keys'
import { getPurchaseOrders } from '@/lib/data/erp/purchase-orders/server'

const poSearch = z.object({
  q: z.string().catch(''),
  status: z.enum(['all', 'draft', 'submitted', 'closed']).catch('all'),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/erp/purchase-orders/',
)({
  validateSearch: poSearch,
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    return context.queryClient.ensureQueryData({
      queryKey: purchaseOrderKeys.list(companyId),
      queryFn: () => getPurchaseOrders({ data: { companyId } }),
    })
  },
  component: PurchaseOrdersPage,
})
