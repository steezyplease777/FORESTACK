import { DEFAULT_PAGE_SIZE } from '@/lib/data/_shared/pagination'

/**
 * Scope filter encoded into the query key so campaign-scoped and
 * standalone list views cache independently of each other and of the
 * full "all projects" feed.
 *
 *   - `all`                  — every project for the company (admin view)
 *   - `standalone`           — `campaign_id IS NULL`, used by the
 *     Projects tab so it isn't cluttered with campaign-scoped rows
 *   - `{ campaignId: string }` — `campaign_id = campaignId`, used by the
 *     Projects card on a campaign detail page
 */
export type PmProjectScope =
  | 'all'
  | 'standalone'
  | { campaignId: string }

function scopeKey(scope: PmProjectScope): string {
  if (scope === 'all') return 'all'
  if (scope === 'standalone') return 'standalone'
  return `campaign:${scope.campaignId}`
}

export const projectKeys = {
  all: ['pm', 'projects'] as const,
  /**
   * Prefix for every paginated-list permutation (any scope, page, q).
   * Use for broad invalidation on mutations — clobbers every
   * `(scope, page, pageSize, q)` combo in one shot so a user who just
   * deleted a row on page 3 of standalone projects doesn't see the row
   * flash back when they switch scopes.
   */
  lists: (companyId: string) =>
    ['pm', 'projects', 'list', companyId] as const,
  list: (
    companyId: string,
    params: {
      scope?: PmProjectScope
      page?: number
      pageSize?: number
      q?: string
    } = {},
  ) =>
    [
      'pm',
      'projects',
      'list',
      companyId,
      {
        scope: scopeKey(params.scope ?? 'all'),
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        q: params.q ?? '',
      },
    ] as const,
  detail: (companyId: string, projectId: string) =>
    ['pm', 'projects', 'detail', companyId, projectId] as const,
  types: (companyId: string) =>
    ['pm', 'project-types', 'list', companyId] as const,
}
