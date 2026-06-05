import type { QueryClient } from '@tanstack/react-query'

import { vendorKeys } from './keys'

export function invalidateErpVendors(
  queryClient: QueryClient,
  companyId: string,
) {
  queryClient.invalidateQueries({ queryKey: vendorKeys.list(companyId) })
}

export function invalidateErpVendorCategories(
  queryClient: QueryClient,
  companyId: string,
) {
  queryClient.invalidateQueries({ queryKey: vendorKeys.categories(companyId) })
}
