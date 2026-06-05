import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { invalidatePlmStyles } from './mutations'
import { plmStyleDetailQuery, plmStylesListQuery } from './queries'
import { createStyleFn } from './server'
import type { PlmStyle, PlmStyleWithCategory } from './types'

export function usePlmStyles(companyId: string) {
  return useQuery<PlmStyleWithCategory[]>({
    ...plmStylesListQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function usePlmStyleDetail(companyId: string, styleId: string) {
  return useQuery({
    ...plmStyleDetailQuery(companyId, styleId),
    enabled: !!companyId && !!styleId,
  })
}

export function useCreatePlmStyle(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Parameters<typeof createStyleFn>[0]['data'],
    ): Promise<PlmStyle> => createStyleFn({ data: input }),
    onSuccess: () => invalidatePlmStyles(qc, companyId, companySlug),
  })
}

export type { PlmStyle, PlmStyleWithCategory, PlmProductCategory } from './types'
