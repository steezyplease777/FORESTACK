import { createFileRoute } from '@tanstack/react-router'
import { PmOverviewPage } from '@/features/company/pages/pm/pm-index-page'

export const Route = createFileRoute('/$companySlug/_authed/pm/')({
  component: PmOverviewPage,
})
