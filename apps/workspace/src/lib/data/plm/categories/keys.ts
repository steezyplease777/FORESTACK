export const plmProductCategoryKeys = {
  all: ['plm', 'product-categories'] as const,
  list: (companyId: string) =>
    ['plm', 'product-categories', 'list', companyId] as const,
}
