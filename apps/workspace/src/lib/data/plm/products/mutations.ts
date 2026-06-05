import type { QueryClient } from '@tanstack/react-query'

import { invalidatePlmPortalBundle } from '@/lib/data/plm/_shared/invalidate'

import { plmProductKeys } from './keys'

/** Broad invalidation: all product lists + PLM portal bundle for this tenant. */
export function invalidatePlmProducts(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: plmProductKeys.lists(companyId) })
  invalidatePlmPortalBundle(queryClient, companySlug)
}

export function invalidatePlmProductDetail(
  queryClient: QueryClient,
  companyId: string,
  productId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: plmProductKeys.lists(companyId) })
  queryClient.invalidateQueries({
    queryKey: plmProductKeys.detail(companyId, productId),
  })
  invalidatePlmPortalBundle(queryClient, companySlug)
}
