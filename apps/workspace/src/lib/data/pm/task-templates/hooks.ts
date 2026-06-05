import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  invalidatePmTaskCategories,
  invalidatePmTaskTemplates,
  invalidatePmTaskTemplatesWithBundle,
} from './mutations'
import {
  pmTaskCategoriesQuery,
  pmTaskTemplatesListQuery,
} from './queries'
import {
  createTaskCategoryFn,
  createTaskTemplateFn,
  createTaskTemplateItemFn,
  deleteTaskTemplateFn,
  deleteTaskTemplateItemFn,
  updateTaskTemplateFn,
} from './server'
import type {
  PmTaskCategory,
  PmTaskTemplate,
  PmTaskTemplateItem,
  PmTaskTemplateWithItems,
} from './types'

export function useTaskTemplates(companyId: string) {
  return useQuery<PmTaskTemplateWithItems[]>({
    ...pmTaskTemplatesListQuery(companyId),
    enabled: !!companyId,
  })
}

export function useTaskCategories(companyId: string) {
  return useQuery<PmTaskCategory[]>({
    ...pmTaskCategoriesQuery(companyId),
    enabled: !!companyId,
  })
}

export function useCreateTaskTemplate(
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PmTaskTemplate, 'company_id' | 'name'> &
        Partial<Pick<PmTaskTemplate, 'category_id'>> & {
          items?: Array<{
            name: string
            description?: string | null
            default_assignee_company_user_id?: string | null
          }>
        },
    ) => createTaskTemplateFn({ data: input }),
    onSuccess: () =>
      invalidatePmTaskTemplatesWithBundle(qc, companyId, companySlug),
  })
}

export function useUpdateTaskTemplate(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      patch: Partial<Pick<PmTaskTemplate, 'name' | 'category_id'>>
    }) => updateTaskTemplateFn({ data: input }),
    onSuccess: () => invalidatePmTaskTemplates(qc, companyId),
  })
}

export function useDeleteTaskTemplate(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) => deleteTaskTemplateFn({ data: input }),
    onSuccess: () =>
      invalidatePmTaskTemplatesWithBundle(qc, companyId, companySlug),
  })
}

export function useCreateTaskTemplateItem(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PmTaskTemplateItem, 'task_id' | 'company_id' | 'name'> &
        Partial<
          Pick<
            PmTaskTemplateItem,
            'description' | 'default_assignee_company_user_id' | 'sort_order'
          >
        >,
    ) => createTaskTemplateItemFn({ data: input }),
    onSuccess: () => invalidatePmTaskTemplates(qc, companyId),
  })
}

export function useDeleteTaskTemplateItem(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) =>
      deleteTaskTemplateItemFn({ data: input }),
    onSuccess: () => invalidatePmTaskTemplates(qc, companyId),
  })
}

export function useCreateTaskCategory(companyId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string }) =>
      createTaskCategoryFn({ data: input }),
    onSuccess: () => invalidatePmTaskCategories(qc, companyId),
  })
}

export type {
  PmTaskCategory,
  PmTaskTemplate,
  PmTaskTemplateItem,
  PmTaskTemplateWithItems,
} from './types'
