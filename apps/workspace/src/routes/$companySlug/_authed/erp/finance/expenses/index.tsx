import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { ExpensesPage } from '@/features/company/pages/erp/expenses-page'
import {
  erpExpenseStatusesQuery,
  erpExpenseTagsQuery,
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
  categoryIds: z.string().optional().catch(undefined),
  projectIds: z.string().optional().catch(undefined),
  departmentValues: z.string().optional().catch(undefined),
  tagIds: z.string().optional().catch(undefined),
  amountMin: z.string().optional().catch(undefined),
  amountMax: z.string().optional().catch(undefined),
  dateFrom: z.string().optional().catch(undefined),
  dateTo: z.string().optional().catch(undefined),
  sort: z.enum(['created_at', 'title', 'amount']).catch('created_at'),
  dir: z.enum(['asc', 'desc']).catch('desc'),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/erp/finance/expenses/',
)({
  validateSearch: expensesSearch,
  loaderDeps: ({
    search: {
      page,
      pageSize,
      q,
      statusId,
      categoryIds,
      projectIds,
      departmentValues,
      tagIds,
      amountMin,
      amountMax,
      dateFrom,
      dateTo,
      sort,
      dir,
    },
  }) => ({
    page,
    pageSize,
    q,
    statusId,
    categoryIds,
    projectIds,
    departmentValues,
    tagIds,
    amountMin,
    amountMax,
    dateFrom,
    dateTo,
    sort,
    dir,
  }),
  loader: ({ context, deps }) => {
    const companyId = (context as { company?: { companyId?: string } }).company
      ?.companyId
    if (!companyId) return
    const qc = context.queryClient
    const {
      page,
      pageSize,
      q,
      statusId,
      categoryIds,
      projectIds,
      departmentValues,
      tagIds,
      amountMin,
      amountMax,
      dateFrom,
      dateTo,
      sort,
      dir,
    } = deps

    const parseCsv = (raw?: string) =>
      raw?.trim()
        ? raw.split(',').map((s) => s.trim()).filter(Boolean)
        : undefined

    const parseAmount = (raw?: string) => {
      if (!raw?.trim()) return undefined
      const n = parseFloat(raw)
      return Number.isFinite(n) ? n : undefined
    }

    const listParams = {
      page,
      pageSize,
      q,
      statusId,
      categoryIds: parseCsv(categoryIds),
      projectIds: parseCsv(projectIds),
      departmentValues: parseCsv(departmentValues),
      tagIds: parseCsv(tagIds),
      amountMin: parseAmount(amountMin),
      amountMax: parseAmount(amountMax),
      dateFrom,
      dateTo,
      sortColumn: sort,
      sortDirection: dir,
    }

    return Promise.all([
      qc.ensureQueryData(erpExpensesListQuery(companyId, listParams)),
      qc.ensureQueryData(erpExpenseStatusesQuery(companyId)),
      qc.ensureQueryData(erpExpenseTagsQuery(companyId)),
    ])
  },
  component: ExpensesPage,
})
