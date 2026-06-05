import { createFileRoute } from '@tanstack/react-router'

import { PlmSourcingDetailPage } from '@/features/company/pages/plm/sourcing/plm-sourcing-detail-page'
import { plmSourcingDetailQuery } from '@/lib/data/plm/sourcing/queries'
import { plmStylesListQuery } from '@/lib/data/plm/styles/queries'
import { erpVendorsListQuery } from '@/lib/data/erp/vendors/queries'

export const Route = createFileRoute(
  '/$companySlug/_authed/plm/sourcing/$sourcingId',
)({
  loader: ({ context, params }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    // Prefetch edit-form dropdowns alongside the detail so switching
    // into edit mode doesn't trigger extra round-trips.
    return Promise.all([
      qc.ensureQueryData(
        plmSourcingDetailQuery(companyId, params.sourcingId),
      ),
      qc.ensureQueryData(plmStylesListQuery(companyId)),
      qc.ensureQueryData(erpVendorsListQuery(companyId)),
    ])
  },
  component: PlmSourcingDetailPage,
})
