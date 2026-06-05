import {
  DEFAULT_LIST_STALE_TIME,
  DEFAULT_REFERENCE_STALE_TIME,
} from '@/lib/data/_shared/query-policy'
import {
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'

import { projectKeys, type PmProjectScope } from './keys'
import { getProject, getProjects, getProjectTypes } from './server'
import type {
  PmProjectDetail,
  PmProjectType,
  PmProjectWithRefs,
} from './types'

export type UseProjectsOptions = {
  scope?: PmProjectScope
  page?: number
  pageSize?: number
  q?: string
}

export function pmProjectsListQuery(
  companyId: string,
  options: UseProjectsOptions = {},
) {
  const scope: PmProjectScope = options.scope ?? 'all'
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  return {
    queryKey: projectKeys.list(companyId, { scope, page, pageSize, q }),
    queryFn: () =>
      getProjects({ data: { companyId, scope, page, pageSize, q } }),
    staleTime: DEFAULT_LIST_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof projectKeys.list>
    queryFn: () => Promise<PaginatedResult<PmProjectWithRefs>>
    staleTime: number
  }
}

export function pmProjectDetailQuery(companyId: string, projectId: string) {
  return {
    queryKey: projectKeys.detail(companyId, projectId),
    queryFn: () => getProject({ data: { companyId, projectId } }),
  } satisfies {
    queryKey: ReturnType<typeof projectKeys.detail>
    queryFn: () => Promise<PmProjectDetail>
  }
}

export function pmProjectTypesQuery(companyId: string) {
  return {
    queryKey: projectKeys.types(companyId),
    queryFn: () => getProjectTypes({ data: { companyId } }),
    staleTime: DEFAULT_REFERENCE_STALE_TIME,
  } satisfies {
    queryKey: ReturnType<typeof projectKeys.types>
    queryFn: () => Promise<PmProjectType[]>
    staleTime: number
  }
}
