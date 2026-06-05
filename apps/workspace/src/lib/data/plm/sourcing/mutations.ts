import type { QueryClient } from '@tanstack/react-query'

import { invalidatePlmPortalBundle } from '@/lib/data/plm/_shared/invalidate'
import { plmProductKeys } from '@/lib/data/plm/products/keys'

import { plmSourcingKeys } from './keys'

/** Broad invalidation: all sourcing lists + products + PLM portal bundle. */
export function invalidatePlmSourcing(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: plmSourcingKeys.lists(companyId) })
  queryClient.invalidateQueries({ queryKey: plmProductKeys.lists(companyId) })
  invalidatePlmPortalBundle(queryClient, companySlug)
}

export function invalidatePlmSourcingDetail(
  queryClient: QueryClient,
  companyId: string,
  sourcingId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: plmSourcingKeys.lists(companyId) })
  queryClient.invalidateQueries({
    queryKey: plmSourcingKeys.detail(companyId, sourcingId),
  })
  queryClient.invalidateQueries({ queryKey: plmProductKeys.lists(companyId) })
  invalidatePlmPortalBundle(queryClient, companySlug)
}
