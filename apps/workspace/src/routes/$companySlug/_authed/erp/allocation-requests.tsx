import { createFileRoute } from '@tanstack/react-router'

import { AllocationRequestsPage } from '@/features/company/pages/erp/allocation-requests-page'
import { allocationKeys } from '@/lib/data/orders/allocation/keys'
import { getAllocationOrdersList } from '@/lib/data/orders/allocation/server'

export const Route = createFileRoute(
  '/$companySlug/_authed/erp/allocation-requests',
)({
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    return context.queryClient.ensureQueryData({
      queryKey: allocationKeys.list(companyId),
      queryFn: () => getAllocationOrdersList({ data: { companyId } }),
    })
  },
  component: AllocationRequestsPage,
})
