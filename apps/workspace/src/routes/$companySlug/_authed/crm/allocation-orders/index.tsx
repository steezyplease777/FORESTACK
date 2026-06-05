import { createFileRoute } from '@tanstack/react-router'

import { AllocationOrdersPage } from '@/features/company/pages/crm/allocation-orders-page'
import { crmAllocationOrderKeys } from '@/lib/data/crm/allocation-orders/keys'
import { getAllocationOrders } from '@/lib/data/crm/allocation-orders/server'

export const Route = createFileRoute(
  '/$companySlug/_authed/crm/allocation-orders/',
)({
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    return context.queryClient.ensureQueryData({
      queryKey: crmAllocationOrderKeys.list(companyId),
      queryFn: () => getAllocationOrders({ data: { companyId } }),
    })
  },
  component: AllocationOrdersPage,
})
