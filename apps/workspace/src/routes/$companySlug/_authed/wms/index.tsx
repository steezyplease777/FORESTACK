import { createFileRoute } from '@tanstack/react-router'
import { WmsOverviewPage } from '@/features/company/pages/wms/wms-index-page'

export const Route = createFileRoute('/$companySlug/_authed/wms/')({
  component: WmsOverviewPage,
})
