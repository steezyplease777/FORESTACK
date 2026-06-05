import { createFileRoute } from '@tanstack/react-router'
import { ErpOverviewPage } from '@/features/company/pages/erp/erp-index-page'

export const Route = createFileRoute('/$companySlug/_authed/erp/')({
  component: ErpOverviewPage,
})
