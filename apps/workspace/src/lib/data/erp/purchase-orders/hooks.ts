// @ts-nocheck
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { purchaseOrderKeys } from './keys'
import {
  createPurchaseOrderFn,
  getPurchaseOrder,
  getPurchaseOrders,
  updatePurchaseOrderFn,
} from './server'
import type { CreatePurchaseOrderInput } from './types'

export function usePurchaseOrders(companyId: string) {
  return useQuery({
    queryKey: purchaseOrderKeys.list(companyId),
    queryFn: () => getPurchaseOrders({ data: { companyId } }),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function usePurchaseOrder(purchaseOrderId: string | null) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(purchaseOrderId ?? ''),
    queryFn: () => getPurchaseOrder({ data: { purchaseOrderId: purchaseOrderId! } }),
    enabled: !!purchaseOrderId,
    placeholderData: keepPreviousData,
  })
}

export function useCreatePurchaseOrder(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) =>
      createPurchaseOrderFn({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.list(companyId) })
    },
  })
}

export function useUpdatePurchaseOrder(companyId: string, poId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<CreatePurchaseOrderInput>) =>
      updatePurchaseOrderFn({ data: { poId, patch } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.list(companyId) })
      qc.invalidateQueries({ queryKey: purchaseOrderKeys.detail(poId) })
    },
  })
}
