// @ts-nocheck
import { useQuery } from '@tanstack/react-query'

import { BUNDLE_GC_TIME, BUNDLE_STALE_TIME } from '../shared'
import { plmKeys } from './keys'
import { getPlmBundle } from './server'
import type { PlmBundle } from './types'

export function usePlmBundle(companySlug: string) {
  return useQuery<PlmBundle>({
    queryKey: plmKeys.bundle(companySlug),
    queryFn: () => getPlmBundle({ data: { companySlug } }),
    enabled: !!companySlug,
    staleTime: BUNDLE_STALE_TIME,
    gcTime: BUNDLE_GC_TIME,
  })
}
