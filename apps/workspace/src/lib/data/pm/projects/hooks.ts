import * as React from 'react'
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
  totalPages,
} from '@/lib/data/_shared/pagination'

import {
  invalidatePmProjectAfterUpdate,
  invalidatePmProjects,
  invalidatePmProjectTypes,
} from './mutations'
import {
  pmProjectDetailQuery,
  pmProjectsListQuery,
  pmProjectTypesQuery,
  type UseProjectsOptions,
} from './queries'
import {
  createProjectFn,
  createProjectTypeFn,
  deleteProjectFn,
  updateProjectFn,
} from './server'
import type {
  PmProject,
  PmProjectDetail,
  PmProjectType,
  PmProjectWithRefs,
} from './types'

export type { UseProjectsOptions } from './queries'

export function useProjects(
  companyId: string,
  options: UseProjectsOptions = {},
) {
  const qc = useQueryClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  const query = useQuery<PaginatedResult<PmProjectWithRefs>>({
    ...pmProjectsListQuery(companyId, options),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })

  const totalCount = query.data?.total ?? 0
  const pageCount = totalPages(totalCount, pageSize)

  React.useEffect(() => {
    if (!companyId) return
    if (query.isLoading || query.isPlaceholderData) return
    const nextPage = page + 1
    if (nextPage > pageCount) return
    qc.prefetchQuery({
      ...pmProjectsListQuery(companyId, { ...options, page: nextPage }),
    })
  }, [
    companyId,
    options,
    page,
    pageSize,
    q,
    pageCount,
    query.isLoading,
    query.isPlaceholderData,
    qc,
  ])

  return query
}

export function useProject(companyId: string, projectId: string) {
  return useQuery<PmProjectDetail>({
    ...pmProjectDetailQuery(companyId, projectId),
    enabled: !!companyId && !!projectId,
  })
}

export function useProjectTypes(companyId: string) {
  return useQuery<PmProjectType[]>({
    ...pmProjectTypesQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateProject(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PmProject, 'company_id' | 'type_id' | 'name'> &
        Partial<
          Pick<
            PmProject,
            | 'campaign_id'
            | 'description'
            | 'start_date'
            | 'end_date'
            | 'status'
          >
        >,
    ) => createProjectFn({ data: input }),
    onSuccess: (row) =>
      invalidatePmProjects(qc, companyId, companySlug, row.campaign_id),
  })
}

export function useUpdateProject(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: Partial<Omit<PmProject, 'id' | 'company_id' | 'created_at'>> & {
      id: string
    }) => updateProjectFn({ data: { id, patch } }),
    onSuccess: (_, vars) =>
      invalidatePmProjectAfterUpdate(qc, companyId, vars.id, companySlug),
  })
}

export function useDeleteProject(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      campaign_id: _campaignId,
    }: {
      id: string
      campaign_id?: string | null
    }) => deleteProjectFn({ data: { id } }),
    onSuccess: (_, { campaign_id }) =>
      invalidatePmProjects(qc, companyId, companySlug, campaign_id),
  })
}

export function useCreateProjectType(
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PmProjectType, 'company_id' | 'name'> &
        Partial<Pick<PmProjectType, 'description'>>,
    ) => createProjectTypeFn({ data: input }),
    onSuccess: () =>
      invalidatePmProjectTypes(qc, companyId, companySlug),
  })
}

export type {
  PmProject,
  PmProjectDetail,
  PmProjectType,
  PmProjectWithRefs,
} from './types'
