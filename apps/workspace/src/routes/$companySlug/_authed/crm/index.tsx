import { createFileRoute } from '@tanstack/react-router'
import { CrmOverviewPage } from '@/features/company/pages/crm/crm-index-page'

export const Route = createFileRoute('/$companySlug/_authed/crm/')({
  component: CrmOverviewPage,
})
