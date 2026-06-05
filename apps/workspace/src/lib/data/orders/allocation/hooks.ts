// @ts-nocheck
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { allocationKeys } from './keys'
import { getAllocationOrderById, getAllocationOrdersList } from './server'

export function useAllocationOrders(companyId: string) {
  return useQuery({
    queryKey: allocationKeys.list(companyId),
    queryFn: () => getAllocationOrdersList({ data: { companyId } }),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useAllocationOrder(allocationId: string | null) {
  return useQuery({
    queryKey: allocationKeys.detail(allocationId ?? ''),
    queryFn: () =>
      getAllocationOrderById({ data: { allocationOrderId: allocationId! } }),
    enabled: !!allocationId,
    placeholderData: keepPreviousData,
  })
}
