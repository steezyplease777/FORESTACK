export const vendorKeys = {
  all: ['vendors'] as const,
  list: (companyId: string) => ['vendors', 'list', companyId] as const,
  categories: (companyId: string) =>
    ['vendors', 'categories', companyId] as const,
}
