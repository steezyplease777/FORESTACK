// @ts-nocheck
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { allocationKeys } from '@/lib/data/orders/allocation/keys'

import { crmAllocationOrderKeys } from './keys'
import {
  cancelAllocationOrderFn,
  createAllocationOrderFn,
  getAllocationOrder,
  getAllocationOrders,
  uncancelAllocationOrderFn,
} from './server'
import type {
  CreateAllocationOrderInput,
  CreateAllocationOrderLineInput,
} from './types'

export function useCrmAllocationOrders(companyId: string) {
  return useQuery({
    queryKey: crmAllocationOrderKeys.list(companyId),
    queryFn: () => getAllocationOrders({ data: { companyId } }),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useCrmAllocationOrder(id: string | null) {
  return useQuery({
    queryKey: crmAllocationOrderKeys.detail(id ?? ''),
    queryFn: () => getAllocationOrder({ data: { id: id! } }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}

export function useCreateAllocationOrder(companyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      order: CreateAllocationOrderInput
      lines: Omit<CreateAllocationOrderLineInput, 'crm_allocation_order_id'>[]
    }) => createAllocationOrderFn({ data: params }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: crmAllocationOrderKeys.list(companyId),
      })
      queryClient.invalidateQueries({ queryKey: allocationKeys.all })
    },
  })
}

export function useCancelAllocationOrder(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelAllocationOrderFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: crmAllocationOrderKeys.list(companyId),
      })
      queryClient.invalidateQueries({ queryKey: allocationKeys.all })
    },
  })
}

export function useApproveAllocationOrder(companyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => uncancelAllocationOrderFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: crmAllocationOrderKeys.list(companyId),
      })
      queryClient.invalidateQueries({ queryKey: allocationKeys.all })
    },
  })
}
