import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { SalesChannelsPage } from '@/features/company/pages/erp/sales-channels-page'
import { salesChannelKeys } from '@/lib/data/erp/sales-channels/keys'
import { getSalesChannels } from '@/lib/data/erp/sales-channels/server'

const salesChannelsSearch = z.object({
  q: z.string().catch(''),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/erp/sales-channels',
)({
  validateSearch: salesChannelsSearch,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: salesChannelKeys.list(),
      queryFn: () => getSalesChannels(),
    }),
  component: SalesChannelsPage,
})
