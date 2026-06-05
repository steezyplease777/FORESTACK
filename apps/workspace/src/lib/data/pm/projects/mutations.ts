import type { QueryClient } from '@tanstack/react-query'

import { campaignKeys } from '@/lib/data/pm/campaigns/keys'
import { invalidatePmPortalBundle } from '@/lib/data/pm/_shared/invalidate'

import { projectKeys } from './keys'

export function invalidatePmProjects(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
  campaignId?: string | null,
) {
  queryClient.invalidateQueries({ queryKey: projectKeys.lists(companyId) })
  invalidatePmPortalBundle(queryClient, companySlug)
  if (campaignId) {
    queryClient.invalidateQueries({
      queryKey: campaignKeys.detail(companyId, campaignId),
    })
  }
}

export function invalidatePmProjectDetail(
  queryClient: QueryClient,
  companyId: string,
  projectId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: projectKeys.lists(companyId) })
  queryClient.invalidateQueries({
    queryKey: projectKeys.detail(companyId, projectId),
  })
  invalidatePmPortalBundle(queryClient, companySlug)
}

/**
 * After a project edit that may re-parent between campaigns (or to/from
 * standalone), clobber every campaign detail key — we don't track the
 * prior `campaign_id` on the client.
 */
export function invalidatePmProjectAfterUpdate(
  queryClient: QueryClient,
  companyId: string,
  projectId: string,
  companySlug: string,
) {
  invalidatePmProjectDetail(queryClient, companyId, projectId, companySlug)
  queryClient.invalidateQueries({ queryKey: ['pm', 'campaigns', 'detail'] })
}

export function invalidatePmProjectTypes(
  queryClient: QueryClient,
  companyId: string,
  companySlug: string,
) {
  queryClient.invalidateQueries({ queryKey: projectKeys.types(companyId) })
  invalidatePmPortalBundle(queryClient, companySlug)
}
