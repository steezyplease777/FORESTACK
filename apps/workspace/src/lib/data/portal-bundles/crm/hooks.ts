// @ts-nocheck
import { useQuery } from '@tanstack/react-query'

import { BUNDLE_GC_TIME, BUNDLE_STALE_TIME } from '../shared'
import { crmKeys } from './keys'
import { getCrmBundle } from './server'
import type { CrmBundle } from './types'

export function useCrmBundle(companySlug: string) {
  return useQuery<CrmBundle>({
    queryKey: crmKeys.bundle(companySlug),
    queryFn: () => getCrmBundle({ data: { companySlug } }),
    enabled: !!companySlug,
    staleTime: BUNDLE_STALE_TIME,
    gcTime: BUNDLE_GC_TIME,
  })
}
