import { createFileRoute } from '@tanstack/react-router'
import { EditPurchaseOrderPage } from '@/features/company/pages/erp/purchase-order-edit-page'

export const Route = createFileRoute('/$companySlug/_authed/erp/purchase-orders/$id/edit')({
  component: EditPurchaseOrderPage,
})
