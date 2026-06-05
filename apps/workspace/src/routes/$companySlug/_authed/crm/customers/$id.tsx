import { createFileRoute } from '@tanstack/react-router'

import { CustomerDetailPage } from '@/features/company/pages/crm/customer-detail-page'
import { crmCompanyKeys } from '@/lib/data/crm/companies/keys'
import { getCrmCompany } from '@/lib/data/crm/companies/server'

export const Route = createFileRoute(
  '/$companySlug/_authed/crm/customers/$id',
)({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData({
      queryKey: crmCompanyKeys.detail(params.id),
      queryFn: () => getCrmCompany({ data: { id: params.id } }),
    }),
  component: CustomerDetailPage,
})
