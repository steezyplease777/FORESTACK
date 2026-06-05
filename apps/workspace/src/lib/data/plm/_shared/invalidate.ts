import type { QueryClient } from '@tanstack/react-query'

import { plmKeys } from '@/lib/data/portal-bundles/plm/keys'

/** Invalidate the PLM portal bundle after entity mutations under `/plm`. */
export function invalidatePlmPortalBundle(
  queryClient: QueryClient,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: plmKeys.bundle(companySlug) })
}
