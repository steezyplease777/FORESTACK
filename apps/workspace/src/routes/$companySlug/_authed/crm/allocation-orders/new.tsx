import { createFileRoute } from '@tanstack/react-router'
import { NewAllocationOrderPage } from '@/features/company/pages/crm/allocation-orders-new-page'

export const Route = createFileRoute('/$companySlug/_authed/crm/allocation-orders/new')({
  component: NewAllocationOrderPage,
})
