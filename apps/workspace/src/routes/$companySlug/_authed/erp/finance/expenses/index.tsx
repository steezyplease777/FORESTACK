import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ExpensesPage } from '@/features/company/pages/erp/expenses-page'
import {
  erpExpenseStatusesQuery,
  erpExpensesListQuery,
} from '@/lib/data/erp/expenses/queries'
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '@/lib/data/_shared/pagination'

const expensesSearch = z.object({
  q: z.string().catch(''),
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_PAGE_SIZE)
    .catch(DEFAULT_PAGE_SIZE),
  statusId: z.string().optional().catch(undefined),
  sort: z.enum(['created_at', 'title', 'amount']).catch('created_at'),
  dir: z.enum(['asc', 'desc']).catch('desc'),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/erp/finance/expenses/',
)({
  validateSearch: expensesSearch,
  loaderDeps: ({ search: { page, pageSize, q, statusId, sort, dir } }) => ({
    page,
    pageSize,
    q,
    statusId,
    sort,
    dir,
  }),
  loader: ({ context, deps }) => {
    const companyId = (context as { company?: { companyId?: string } }).company
      ?.companyId
    if (!companyId) return
    const qc = context.queryClient
    const { page, pageSize, q, statusId, sort, dir } = deps
    return Promise.all([
      qc.ensureQueryData(
        erpExpensesListQuery(companyId, {
          page,
          pageSize,
          q,
          statusId,
          sortColumn: sort,
          sortDirection: dir,
        }),
      ),
      qc.ensureQueryData(erpExpenseStatusesQuery(companyId)),
    ])
  },
  component: ExpensesPage,
})
