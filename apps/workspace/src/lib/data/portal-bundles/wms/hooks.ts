// @ts-nocheck
import { useQuery } from '@tanstack/react-query'

import { BUNDLE_GC_TIME, BUNDLE_STALE_TIME } from '../shared'
import { wmsKeys } from './keys'
import { getWmsBundle } from './server'
import type { WmsBundle } from './types'

/**
 * Reads the WMS portal bundle for a tenant. Uses the shared bundle
 * cache policy (`staleTime: Infinity`, `gcTime: 30m`) so every page
 * inside the portal reads from cache without refetching, and the
 * payload is released 30 min after the user leaves the portal.
 *
 * Invalidate with `queryClient.invalidateQueries({ queryKey: wmsKeys.bundle(slug) })`
 * from any mutation that changes WMS state.
 */
export function useWmsBundle(companySlug: string) {
  return useQuery<WmsBundle>({
    queryKey: wmsKeys.bundle(companySlug),
    queryFn: () => getWmsBundle({ data: { companySlug } }),
    enabled: !!companySlug,
    staleTime: BUNDLE_STALE_TIME,
    gcTime: BUNDLE_GC_TIME,
  })
}
