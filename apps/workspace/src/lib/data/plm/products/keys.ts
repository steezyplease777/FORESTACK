import { DEFAULT_PAGE_SIZE } from '@/lib/data/_shared/pagination'

export const plmProductKeys = {
  all: ['plm', 'products'] as const,
  /**
   * Prefix for every paginated permutation — use for broad invalidation
   * so a create/update/delete clears ALL (page, q) combos at once.
   */
  lists: (companyId: string) => ['plm', 'products', 'list', companyId] as const,
  list: (
    companyId: string,
    params: { page?: number; pageSize?: number; q?: string } = {},
  ) =>
    [
      'plm',
      'products',
      'list',
      companyId,
      {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        q: params.q ?? '',
      },
    ] as const,
  detail: (companyId: string, productId: string) =>
    ['plm', 'products', 'detail', companyId, productId] as const,
  /** Lightweight search suggestions (used by the link-to-product picker). */
  search: (companyId: string, q: string) =>
    ['plm', 'products', 'search', companyId, q] as const,
}
