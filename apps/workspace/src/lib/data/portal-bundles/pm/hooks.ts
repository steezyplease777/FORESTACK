// @ts-nocheck
import { useQuery } from '@tanstack/react-query'

import { BUNDLE_GC_TIME, BUNDLE_STALE_TIME } from '../shared'
import { pmKeys } from './keys'
import { getPmBundle } from './server'
import type { PmBundle } from './types'

export function usePmBundle(companySlug: string) {
  return useQuery<PmBundle>({
    queryKey: pmKeys.bundle(companySlug),
    queryFn: () => getPmBundle({ data: { companySlug } }),
    enabled: !!companySlug,
    staleTime: BUNDLE_STALE_TIME,
    gcTime: BUNDLE_GC_TIME,
  })
}
