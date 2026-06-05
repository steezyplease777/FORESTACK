import { DEFAULT_PAGE_SIZE } from '@/lib/data/_shared/pagination'

export const plmVariantKeys = {
  all: ['plm', 'variants'] as const,
  lists: (companyId: string) => ['plm', 'variants', 'list', companyId] as const,
  list: (
    companyId: string,
    params: { page?: number; pageSize?: number; q?: string } = {},
  ) =>
    [
      'plm',
      'variants',
      'list',
      companyId,
      {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
        q: params.q ?? '',
      },
    ] as const,
}
