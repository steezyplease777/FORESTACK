import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { plmProductCategoriesListQuery } from './queries'
import type { PlmProductCategory } from './types'

export function usePlmProductCategories(companyId: string) {
  return useQuery<PlmProductCategory[]>({
    ...plmProductCategoriesListQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export type { PlmProductCategory } from './types'
