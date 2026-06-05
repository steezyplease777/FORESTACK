import { createFileRoute } from '@tanstack/react-router'
import { PlmOverviewPage } from '@/features/company/pages/plm/plm-index-page'

export const Route = createFileRoute('/$companySlug/_authed/plm/')({
  component: PlmOverviewPage,
})
