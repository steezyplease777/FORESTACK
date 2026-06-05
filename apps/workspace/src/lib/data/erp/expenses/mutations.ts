import type { QueryClient } from '@tanstack/react-query'

import { expenseKeys } from './keys'

export function invalidateErpExpenses(qc: QueryClient, _companyId: string) {
  return qc.invalidateQueries({ queryKey: expenseKeys.all })
}
