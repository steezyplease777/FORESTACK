import type { ExpenseListParams } from './types'

export const expenseKeys = {
  all: ['erp-expenses'] as const,
  list: (companyId: string, params: Omit<ExpenseListParams, 'companyId'>) =>
    ['erp-expenses', 'list', companyId, params] as const,
  statuses: (companyId: string) =>
    ['erp-expenses', 'statuses', companyId] as const,
}
