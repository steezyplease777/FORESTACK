import { createFileRoute } from '@tanstack/react-router'

import { CustomersPage } from '@/features/company/pages/crm/customers-page'
import { crmCompanyKeys } from '@/lib/data/crm/companies/keys'
import { getCrmCompanies } from '@/lib/data/crm/companies/server'

export const Route = createFileRoute(
  '/$companySlug/_authed/crm/customers/',
)({
  loader: ({ context }) => {
    const companyId = (context as any).company?.companyId
    if (!companyId) return
    return context.queryClient.ensureQueryData({
      queryKey: crmCompanyKeys.list(companyId),
      queryFn: () => getCrmCompanies({ data: { companyId } }),
    })
  },
  component: CustomersPage,
})
