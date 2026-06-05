import { DEFAULT_PAGE_SIZE } from '@/lib/data/_shared/pagination'

export const plmSourcingKeys = {
  all: ['plm', 'sourcing'] as const,
  lists: (companyId: string) => ['plm', 'sourcing', 'list', companyId] as const,
  list: (
    companyId: string,
    params: { page?: number; pageSize?: number; q?: string } = {},
  ) =>
    [
      'plm',
      'sourcing',
      'list',
      companyId,
      {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        q: params.q ?? '',
      },
    ] as const,
  detail: (companyId: string, sourcingId: string) =>
    ['plm', 'sourcing', 'detail', companyId, sourcingId] as const,
  /**
   * All sourcing rows for a given style — used on the Product detail
   * page to let a user pick which sourcing row a product should point
   * at, and on the Style detail page once that lands.
   */
  byStyle: (companyId: string, styleId: string) =>
    ['plm', 'sourcing', 'by-style', companyId, styleId] as const,
}
