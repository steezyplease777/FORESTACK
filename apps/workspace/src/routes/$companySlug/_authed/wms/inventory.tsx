import { createFileRoute } from '@tanstack/react-router'
import { InventoryPage } from '@/features/company/pages/wms/inventory-page'

export const Route = createFileRoute('/$companySlug/_authed/wms/inventory')({
  component: InventoryPage,
})
