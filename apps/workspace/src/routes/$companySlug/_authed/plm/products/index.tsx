import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PlmProductsPage } from '@/features/company/pages/plm/products/plm-products-page'
import { plmProductsListQuery } from '@/lib/data/plm/products/queries'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/data/_shared/pagination'

const productsSearch = z.object({
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
  '/$companySlug/_authed/plm/products/',
)({
  validateSearch: productsSearch,
  loaderDeps: ({ search: { page, pageSize, q } }) => ({ page, pageSize, q }),
  loader: ({ context, deps }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const { page, pageSize, q } = deps
    return context.queryClient.ensureQueryData(
      plmProductsListQuery(companyId, { page, pageSize, q }),
    )
  },
  component: PlmProductsPage,
})
