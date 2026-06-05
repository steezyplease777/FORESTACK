import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  invalidateErpVendorCategories,
  invalidateErpVendors,
} from './mutations'
import { erpVendorCategoriesQuery, erpVendorsListQuery } from './queries'
import {
  createVendorCategoryFn,
  createVendorFn,
  updateVendorFn,
} from './server'
import type { Vendor, VendorCategory } from './types'

export function useVendors(companyId: string) {
  return useQuery({
    ...erpVendorsListQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useVendorCategories(companyId: string) {
  return useQuery({
    ...erpVendorCategoriesQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateVendor(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<Vendor, 'company_id' | 'name' | 'category_id'> &
        Partial<
          Pick<
            Vendor,
            | 'description'
            | 'contact_name'
            | 'contact_email'
            | 'contact_phone'
            | 'website_url'
          >
        >,
    ) => createVendorFn({ data: input }),
    onSuccess: () => invalidateErpVendors(qc, companyId),
  })
}

export function useUpdateVendor(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<Vendor> & { id: string }) =>
      updateVendorFn({ data: { id, patch } }),
    onSuccess: () => invalidateErpVendors(qc, companyId),
  })
}

export function useCreateVendorCategory(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<VendorCategory, 'company_id' | 'name'> &
        Partial<Pick<VendorCategory, 'description'>>,
    ) => createVendorCategoryFn({ data: input }),
    onSuccess: () => invalidateErpVendorCategories(qc, companyId),
  })
}

export type { Vendor, VendorCategory, VendorWithCategory } from './types'
