import type { QueryClient } from '@tanstack/react-query'

import { invalidatePlmPortalBundle } from '@/lib/data/plm/_shared/invalidate'
import { plmProductKeys } from '@/lib/data/plm/products/keys'

import { plmStyleKeys } from './keys'

/** Broad invalidation after style create — dropdowns, products, PLM bundle. */
export function invalidatePlmStyles(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: plmStyleKeys.all })
  queryClient.invalidateQueries({ queryKey: plmProductKeys.lists(companyId) })
  invalidatePlmPortalBundle(queryClient, companySlug)
}
