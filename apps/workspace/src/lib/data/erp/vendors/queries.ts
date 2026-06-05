import {
  DEFAULT_LIST_STALE_TIME,
  DEFAULT_REFERENCE_STALE_TIME,
} from '@/lib/data/_shared/query-policy'

import { vendorKeys } from './keys'
import { getVendorCategories, getVendors } from './server'
import type { VendorCategory, VendorWithCategory } from './types'

export function erpVendorsListQuery(companyId: string) {
  return {
    queryKey: vendorKeys.list(companyId),
    queryFn: () => getVendors({ data: { companyId } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof vendorKeys.list>
    queryFn: () => Promise<VendorWithCategory[]>
    staleTime: number
  }
}

export function erpVendorCategoriesQuery(companyId: string) {
  return {
    queryKey: vendorKeys.categories(companyId),
    queryFn: () => getVendorCategories({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof vendorKeys.categories>
    queryFn: () => Promise<VendorCategory[]>
    staleTime: number
  }
}
