import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PlmVariantsPage } from '@/features/company/pages/plm/variants/plm-variants-page'
import { plmVariantsListQuery } from '@/lib/data/plm/variants/queries'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/data/_shared/pagination'

const variantsSearch = z.object({
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
  '/$companySlug/_authed/plm/variants',
)({
  validateSearch: variantsSearch,
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: ({ context, deps }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const { page, pageSize, q } = deps
    return context.queryClient.ensureQueryData(
      plmVariantsListQuery(companyId, { page, pageSize, q }),
    )
  },
  component: PlmVariantsPage,
})
