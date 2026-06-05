import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PlmSourcingNewPage } from '@/features/company/pages/plm/sourcing/plm-sourcing-new-page'
import { plmStylesListQuery } from '@/lib/data/plm/styles/queries'
import { erpVendorsListQuery } from '@/lib/data/erp/vendors/queries'

/**
 * Optional `?styleId=...` seeds the form when the user clicks
 * "Add sourcing" from a product/style detail page.
 */
const sourcingNewSearch = z.object({
  styleId: z.string().optional().catch(undefined),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/plm/sourcing/new',
)({
  validateSearch: sourcingNewSearch,
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    return Promise.all([
      qc.ensureQueryData(plmStylesListQuery(companyId)),
      qc.ensureQueryData(erpVendorsListQuery(companyId)),
    ])
  },
  component: PlmSourcingNewPage,
})
