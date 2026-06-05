import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { VendorsPage } from '@/features/company/pages/erp/vendors-page'
import {
  erpVendorCategoriesQuery,
  erpVendorsListQuery,
} from '@/lib/data/erp/vendors/queries'

const vendorsSearch = z.object({
  q: z.string().catch(''),
  detail: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/$companySlug/_authed/erp/vendors')({
  validateSearch: vendorsSearch,
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    const qc = context.queryClient
    return Promise.all([
      qc.ensureQueryData(erpVendorsListQuery(companyId)),
      qc.ensureQueryData(erpVendorCategoriesQuery(companyId)),
    ])
  },
  component: VendorsPage,
})
