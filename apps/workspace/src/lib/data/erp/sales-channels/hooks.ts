// @ts-nocheck
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { salesChannelKeys } from './keys'
import {
  createSalesChannelFn,
  getSalesChannels,
  updateSalesChannelFn,
} from './server'
import type { SalesChannel, SalesChannelType } from './client'

export function useSalesChannels() {
  return useQuery({
    queryKey: salesChannelKeys.list(),
    queryFn: () => getSalesChannels(),
    placeholderData: keepPreviousData,
  })
}

export function useCreateSalesChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      name: string
      channel_code: string
      sales_channel_type: SalesChannelType
      company_id?: string
    }) => createSalesChannelFn({ data: input }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: salesChannelKeys.list() }),
  })
}

export function useUpdateSalesChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<SalesChannel> & { id: string }) =>
      updateSalesChannelFn({ data: { id, ...patch } as any }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: salesChannelKeys.list() }),
  })
}

export type { SalesChannel, SalesChannelType } from './client'
