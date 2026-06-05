// @ts-nocheck

import * as React from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconSearch,
} from '@tabler/icons-react'

import { useCompany } from '@/features/company/tenant-provider'
import { PageHeader } from '@/components/composites/page-header'
import { EmptyState } from '@/components/composites/empty-state'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { totalPages } from '@/lib/data/_shared/pagination'

import { ExpenseAdminTable } from '@/features/erp/finance/expenses/ExpenseAdminTable'
import { DEFAULT_EXPENSE_TABLE_CONFIG } from '@/features/erp/finance/expenses/config/default-expense-table.config'
import { ExpenseTableToolbar } from '@/features/erp/finance/expenses/filters/ExpenseTableToolbar'
import { buildExpenseQueryParams } from '@/features/erp/finance/expenses/data/query-builder'
import {
  filtersFromSearch,
  filtersToSearchPatch,
} from '@/features/erp/finance/expenses/data/search-params'
import { toExpenseRow } from '@/features/erp/finance/expenses/data/to-row'
import {
  useExpenseStatuses,
  useExpenseTags,
  useExpenses,
} from '@/features/erp/finance/expenses/data/use-expenses-query'

const routeApi = getRouteApi('/$companySlug/_authed/erp/finance/expenses/')

export function ExpensesPage() {
  const { company } = useCompany()
  const companyId = company?.companyId ?? ''

  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()

  const {
    q: qFromUrl,
    page,
    pageSize,
    sort,
    dir,
  } = search

  const filters = React.useMemo(() => filtersFromSearch(search), [search])

  const [searchInput, setSearchInput] = React.useState(qFromUrl)
  React.useEffect(() => {
    setSearchInput((prev) => (prev === qFromUrl ? prev : qFromUrl))
  }, [qFromUrl])

  const commitSearch = useDebouncedCallback(
    (next: string) => {
      navigate({
        search: (prev) => ({ ...prev, q: next, page: 1 }),
        replace: true,
      })
    },
    { wait: 250 },
  )

  const queryParams = buildExpenseQueryParams(filters, sort, dir)
  const expensesQuery = useExpenses(companyId, {
    page,
    pageSize,
    ...queryParams,
  })
  const statusesQuery = useExpenseStatuses(companyId)
  const tagsQuery = useExpenseTags(companyId)
  const statuses = statusesQuery.data ?? []

  const tagsById = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const tag of tagsQuery.data ?? []) {
      map.set(tag.id, tag.name)
    }
    return map
  }, [tagsQuery.data])

  const result = expensesQuery.data
  const rows = React.useMemo(
    () => (result?.rows ?? []).map((rec) => toExpenseRow(rec, tagsById)),
    [result?.rows, tagsById],
  )
  const total = result?.total ?? 0
  const pageCount = totalPages(total, pageSize)
  const isPaging = expensesQuery.isPlaceholderData
  const isInitialLoading = expensesQuery.isLoading && !result

  const setPage = (next: number) =>
    navigate({ search: (prev) => ({ ...prev, page: next }) })

  const applyFilters = (nextFilters: typeof filters) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...filtersToSearchPatch(nextFilters),
        page: 1,
      }),
    })
  }

  const hasActiveFilters =
    !!filters.statusId ||
    !!filters.q ||
    filters.categoryIds.length > 0 ||
    filters.projectIds.length > 0 ||
    filters.departmentValues.length > 0 ||
    filters.tagIds.length > 0 ||
    !!filters.amountMin ||
    !!filters.amountMax ||
    !!filters.dateFrom ||
    !!filters.dateTo

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Expenses"
        description={
          total > 0
            ? `${total.toLocaleString()} total — review and manage company expenses.`
            : 'Review and manage company expenses.'
        }
      />

      <div className="flex flex-col gap-3">
        <ExpenseTableToolbar
          companyId={companyId}
          filters={filters}
          statuses={statuses}
          sortColumn={sort}
          sortDirection={dir}
          onStatusChange={(nextStatusId) =>
            applyFilters({ ...filters, statusId: nextStatusId })
          }
          onFiltersChange={applyFilters}
          onClearStructuredFilters={() =>
            applyFilters({
              ...filters,
              categoryIds: [],
              projectIds: [],
              departmentValues: [],
              tagIds: [],
              amountMin: '',
              amountMax: '',
              dateFrom: null,
              dateTo: null,
            })
          }
        />

        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 w-full pl-9"
            placeholder="Search expenses…"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              commitSearch(e.target.value)
            }}
          />
        </div>

        {isInitialLoading ? (
          <TableSkeleton />
        ) : expensesQuery.error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load expenses
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {expensesQuery.error instanceof Error
                ? expensesQuery.error.message
                : 'Unknown error'}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'Expenses will appear here once created.'
            }
          />
        ) : (
          <div
            className={cn(
              'rounded-md border',
              isPaging ? 'opacity-60 transition-opacity' : undefined,
            )}
          >
            <ExpenseAdminTable
              companyId={companyId}
              config={DEFAULT_EXPENSE_TABLE_CONFIG}
              rows={rows}
              statuses={statuses}
              sortColumn={sort}
              sortDirection={dir}
              onSortChange={(sortColumn, sortDirection) =>
                navigate({
                  search: (prev) => ({
                    ...prev,
                    sort: sortColumn,
                    dir: sortDirection,
                    page: 1,
                  }),
                })
              }
            />

            <div className="flex items-center justify-between gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {total.toLocaleString()} rows
              </span>
              <div className="flex items-center gap-2">
                <span className="tabular-nums">
                  Page {page} of {pageCount}
                </span>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={page <= 1 || isPaging}
                    onClick={() => setPage(1)}
                    aria-label="First page"
                  >
                    <IconChevronsLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={page <= 1 || isPaging}
                    onClick={() => setPage(Math.max(1, page - 1))}
                    aria-label="Previous page"
                  >
                    <IconChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={page >= pageCount || isPaging}
                    onClick={() => setPage(Math.min(pageCount, page + 1))}
                    aria-label="Next page"
                  >
                    <IconChevronRight className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={page >= pageCount || isPaging}
                    onClick={() => setPage(pageCount)}
                    aria-label="Last page"
                  >
                    <IconChevronsRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b bg-muted/30 px-3 py-2.5">
        <div className="h-4 w-full max-w-md animate-pulse rounded bg-muted" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-3 py-3 last:border-b-0"
        >
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}
