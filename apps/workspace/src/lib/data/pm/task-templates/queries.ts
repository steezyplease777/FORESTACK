import { DEFAULT_REFERENCE_STALE_TIME } from '@/lib/data/_shared/query-policy'

import { taskTemplateKeys } from './keys'
import { getTaskCategories, getTaskTemplates } from './server'
import type { PmTaskCategory, PmTaskTemplateWithItems } from './types'

export function pmTaskTemplatesListQuery(companyId: string) {
  return {
    queryKey: taskTemplateKeys.list(companyId),
    queryFn: () => getTaskTemplates({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof taskTemplateKeys.list>
    queryFn: () => Promise<PmTaskTemplateWithItems[]>
    staleTime: number
  }
}

export function pmTaskCategoriesQuery(companyId: string) {
  return {
    queryKey: taskTemplateKeys.categories(companyId),
    queryFn: () => getTaskCategories({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof taskTemplateKeys.categories>
    queryFn: () => Promise<PmTaskCategory[]>
    staleTime: number
  }
}
