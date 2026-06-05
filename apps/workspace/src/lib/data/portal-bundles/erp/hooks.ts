// @ts-nocheck
import { useQuery } from '@tanstack/react-query'

import { BUNDLE_GC_TIME, BUNDLE_STALE_TIME } from '../shared'
import { erpKeys } from './keys'
import { getErpBundle } from './server'
import type { ErpBundle } from './types'

export function useErpBundle(companySlug: string) {
  return useQuery<ErpBundle>({
    queryKey: erpKeys.bundle(companySlug),
    queryFn: () => getErpBundle({ data: { companySlug } }),
    enabled: !!companySlug,
    staleTime: BUNDLE_STALE_TIME,
    gcTime: BUNDLE_GC_TIME,
  })
}
