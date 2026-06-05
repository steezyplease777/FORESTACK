import type { QueryClient } from '@tanstack/react-query'

import { invalidatePmPortalBundle } from '@/lib/data/pm/_shared/invalidate'

import { taskTemplateKeys } from './keys'

export function invalidatePmTaskTemplates(
  queryClient: QueryClient,
  companyId: string,
) {
  queryClient.invalidateQueries({ queryKey: taskTemplateKeys.list(companyId) })
}

export function invalidatePmTaskTemplatesWithBundle(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  invalidatePmTaskTemplates(queryClient, companyId)
  invalidatePmPortalBundle(queryClient, companySlug)
}

export function invalidatePmTaskCategories(
  queryClient: QueryClient,
  companyId: string,
) {
  queryClient.invalidateQueries({
    queryKey: taskTemplateKeys.categories(companyId),
  })
}
