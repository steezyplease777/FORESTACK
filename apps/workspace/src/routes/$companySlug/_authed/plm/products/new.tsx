import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { PlmProductNewPage } from '@/features/company/pages/plm/products/plm-product-new-page'
import { plmProductCategoriesListQuery } from '@/lib/data/plm/categories/queries'
import { plmStylesListQuery } from '@/lib/data/plm/styles/queries'
import { pmCampaignsListQuery } from '@/lib/data/pm/campaigns/queries'
import { erpVendorsListQuery } from '@/lib/data/erp/vendors/queries'

/**
 * Search params drive the wizard:
 * - `mode` is chosen on step 0 and determines the remaining flow:
 *     - `with_style`   → create a new style + sourcing + product
 *     - `without_style` → just create a product (style picker is optional)
 * - `step` is the 1-indexed current step; omitted on the mode chooser.
 *
 * Keeping state in the URL means refresh / back button / deep-linked
 * agent messages all keep the user where they were.
 */
const productNewSearch = z.object({
  mode: z.enum(['with_style', 'without_style']).optional().catch(undefined),
  step: z.coerce.number().int().positive().optional().catch(undefined),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/plm/products/new',
)({
  validateSearch: productNewSearch,
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    // Pre-warm everything the wizard's steps might need. The "with
    // style" path pulls categories + vendors; both paths pull styles
    // (even without-style can pick an existing one) and campaigns.
    // Pre-fetching in parallel avoids janky dropdowns on step entry.
    return Promise.all([
      qc.ensureQueryData(plmStylesListQuery(companyId)),
      qc.ensureQueryData(
        pmCampaignsListQuery(companyId, { page: 1, pageSize: 200 }),
      ),
      qc.ensureQueryData(plmProductCategoriesListQuery(companyId)),
      qc.ensureQueryData(erpVendorsListQuery(companyId)),
    ])
  },
  component: PlmProductNewPage,
})
