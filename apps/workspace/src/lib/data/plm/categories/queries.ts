import { DEFAULT_REFERENCE_STALE_TIME } from '@/lib/data/_shared/query-policy'

import { plmProductCategoryKeys } from './keys'
import { getPlmProductCategories } from './server'
import type { PlmProductCategory } from './types'

export function plmProductCategoriesListQuery(companyId: string) {
  return {
    queryKey: plmProductCategoryKeys.list(companyId),
    queryFn: () => getPlmProductCategories({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof plmProductCategoryKeys.list>
    queryFn: () => Promise<PlmProductCategory[]>
    staleTime: number
  }
}
