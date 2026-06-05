import { createFileRoute } from '@tanstack/react-router'

import { AllocationPage } from '@/features/company/pages/wms/allocation-page'
import { allocationKeys } from '@/lib/data/orders/allocation/keys'
import { getAllocationOrdersList } from '@/lib/data/orders/allocation/server'

export const Route = createFileRoute('/$companySlug/_authed/wms/allocation')({
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    return context.queryClient.ensureQueryData({
      queryKey: allocationKeys.list(companyId),
      queryFn: () => getAllocationOrdersList({ data: { companyId } }),
    })
  },
  component: AllocationPage,
})
