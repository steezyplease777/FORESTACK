import { DEFAULT_REFERENCE_STALE_TIME } from '@/lib/data/_shared/query-policy'

import { plmStyleKeys } from './keys'
import { getStyleDetail, getStyles } from './server'
import type { PlmStyleWithCategory } from './types'

export function plmStylesListQuery(companyId: string) {
  return {
    queryKey: plmStyleKeys.list(companyId),
    queryFn: () => getStyles({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof plmStyleKeys.list>
    queryFn: () => Promise<PlmStyleWithCategory[]>
    staleTime: number
  }
}

export function plmStyleDetailQuery(companyId: string, styleId: string) {
  return {
    queryKey: plmStyleKeys.detail(companyId, styleId),
    queryFn: () => getStyleDetail({ data: { companyId, styleId } }),
  } satisfies {
    queryKey: ReturnType<typeof plmStyleKeys.detail>
    queryFn: () => Promise<PlmStyleWithCategory | null>
  }
}
