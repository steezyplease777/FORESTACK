import type { QueryClient } from '@tanstack/react-query'

import { pmKeys } from '@/lib/data/portal-bundles/pm/keys'

/** Invalidate the PM portal bundle after entity mutations under `/pm`. */
export function invalidatePmPortalBundle(
  queryClient: QueryClient,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: pmKeys.bundle(companySlug) })
}
