import { DEFAULT_PAGE_SIZE } from '@/lib/data/_shared/pagination'

export const campaignKeys = {
  all: ['pm', 'campaigns'] as const,
  /**
   * Prefix for every paginated-list permutation. Use for broad
   * invalidation on mutations — clobbers every `(page, pageSize, q)`
   * combo in one shot so a user who mutated on page 3 while
   * searching doesn't see stale data after switching filters.
   */
  lists: (companyId: string) =>
    ['pm', 'campaigns', 'list', companyId] as const,
  list: (
    companyId: string,
    params: { page?: number; pageSize?: number; q?: string } = {},
  ) =>
    [
      'pm',
      'campaigns',
      'list',
      companyId,
      {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        q: params.q ?? '',
      },
    ] as const,
  detail: (companyId: string, campaignId: string) =>
    ['pm', 'campaigns', 'detail', companyId, campaignId] as const,
  categories: (companyId: string) =>
    ['pm', 'campaign-categories', 'list', companyId] as const,
}
