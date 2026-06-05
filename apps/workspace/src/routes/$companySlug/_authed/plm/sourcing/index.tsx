import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PlmSourcingPage } from '@/features/company/pages/plm/sourcing/plm-sourcing-page'
import { plmSourcingListQuery } from '@/lib/data/plm/sourcing/queries'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/data/_shared/pagination'

const sourcingSearch = z.object({
  q: z.string().catch(''),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .catch(DEFAULT_PAGE_SIZE),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/plm/sourcing/',
)({
  validateSearch: sourcingSearch,
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: ({ context, deps }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const { page, pageSize, q } = deps
    return context.queryClient.ensureQueryData(
      plmSourcingListQuery(companyId, { page, pageSize, q }),
    )
  },
  component: PlmSourcingPage,
})
