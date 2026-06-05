import { createFileRoute } from '@tanstack/react-router'
import { OrdersPage } from '@/features/company/pages/wms/orders-page'

export const Route = createFileRoute('/$companySlug/_authed/wms/orders/')({
  component: OrdersPage,
})
