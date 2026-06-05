import { createFileRoute } from '@tanstack/react-router'
import { OrderDetailPage } from '@/features/company/pages/wms/order-detail-page'

export const Route = createFileRoute('/$companySlug/_authed/wms/orders/$id')({
  component: OrderDetailPage,
})
