import type { ExpenseListParams } from './types'

export const expenseKeys = {
  all: ['erp-expenses'] as const,
  list: (companyId: string, params: Omit<ExpenseListParams, 'companyId'>) =>
    ['erp-expenses', 'list', companyId, params] as const,
  statuses: (companyId: string) =>
    ['erp-expenses', 'statuses', companyId] as const,
  categories: (companyId: string) =>
    ['erp-expenses', 'categories', companyId] as const,
  tags: (companyId: string) => ['erp-expenses', 'tags', companyId] as const,
  projects: (companyId: string) =>
    ['erp-expenses', 'projects', companyId] as const,
  departments: (companyId: string) =>
    ['erp-expenses', 'departments', companyId] as const,
}
