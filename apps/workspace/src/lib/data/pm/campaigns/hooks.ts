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
  invalidatePmCampaignCategories,
  invalidatePmCampaignCategoriesAndLists,
  invalidatePmCampaignDetail,
  invalidatePmCampaigns,
} from './mutations'
import {
  pmCampaignCategoriesQuery,
  pmCampaignDetailQuery,
  pmCampaignsListQuery,
  type UseCampaignsOptions,
} from './queries'
import {
  createCampaignCategoryFn,
  createCampaignFn,
  deleteCampaignCategoryFn,
  deleteCampaignFn,
  updateCampaignCategoryFn,
  updateCampaignFn,
} from './server'
import type {
  PmCampaign,
  PmCampaignCategory,
  PmCampaignDetail,
  PmCampaignWithCategory,
} from './types'

export type { UseCampaignsOptions } from './queries'

export function useCampaigns(
  companyId: string,
  options: UseCampaignsOptions = {},
) {
  const qc = useQueryClient()
  const page = options.page ?? 1
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const q = options.q ?? ''

  const query = useQuery<PaginatedResult<PmCampaignWithCategory>>({
    ...pmCampaignsListQuery(companyId, options),
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
      ...pmCampaignsListQuery(companyId, { page: nextPage, pageSize, q }),
    })
  }, [
    companyId,
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

export function useCampaign(companyId: string, campaignId: string) {
  return useQuery<PmCampaignDetail>({
    ...pmCampaignDetailQuery(companyId, campaignId),
    enabled: !!companyId && !!campaignId,
  })
}

export function useCampaignCategories(companyId: string) {
  return useQuery<PmCampaignCategory[]>({
    ...pmCampaignCategoriesQuery(companyId),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useCreateCampaign(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PmCampaign, 'company_id' | 'category_id' | 'name'> &
        Partial<
          Pick<
            PmCampaign,
            | 'campaign_code'
            | 'description'
            | 'start_date'
            | 'end_date'
            | 'campaign_image_url'
          >
        >,
    ) => createCampaignFn({ data: input }),
    onSuccess: () => invalidatePmCampaigns(qc, companyId, companySlug),
  })
}

export function useUpdateCampaign(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...patch
    }: Partial<Omit<PmCampaign, 'id' | 'company_id' | 'created_at'>> & {
      id: string
    }) => updateCampaignFn({ data: { id, patch } }),
    onSuccess: (_, vars) =>
      invalidatePmCampaignDetail(qc, companyId, vars.id, companySlug),
  })
}

export function useDeleteCampaign(companyId: string, companySlug: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCampaignFn({ data: { id } }),
    onSuccess: () => invalidatePmCampaigns(qc, companyId, companySlug),
  })
}

export function useCreateCampaignCategory(
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Pick<PmCampaignCategory, 'company_id' | 'name'> &
        Partial<Pick<PmCampaignCategory, 'description'>>,
    ) => createCampaignCategoryFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignCategories(qc, companyId, companySlug),
  })
}

export function useUpdateCampaignCategory(
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      id: string
      patch: Partial<Pick<PmCampaignCategory, 'name' | 'description'>>
    }) => updateCampaignCategoryFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignCategoriesAndLists(qc, companyId, companySlug),
  })
}

export function useDeleteCampaignCategory(
  companyId: string,
  companySlug: string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string }) =>
      deleteCampaignCategoryFn({ data: input }),
    onSuccess: () =>
      invalidatePmCampaignCategories(qc, companyId, companySlug),
  })
}

export type {
  PmCampaign,
  PmCampaignCategory,
  PmCampaignDetail,
  PmCampaignWithCategory,
} from './types'
