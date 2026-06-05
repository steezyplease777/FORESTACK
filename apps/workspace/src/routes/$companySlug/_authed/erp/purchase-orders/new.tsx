import { createFileRoute } from '@tanstack/react-router'
import { NewPurchaseOrderPage } from '@/features/company/pages/erp/purchase-orders-new-page'

export const Route = createFileRoute('/$companySlug/_authed/erp/purchase-orders/new')({
  component: NewPurchaseOrderPage,
})
