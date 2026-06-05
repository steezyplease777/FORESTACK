// @ts-nocheck

import * as React from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { useDebouncedCallback } from '@tanstack/react-pacer'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'

import { useCompany } from '@/features/company/tenant-provider'
import { EmptyState } from '@/components/composites/empty-state'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { totalPages } from '@/lib/data/_shared/pagination'

import { BulkActionsToolbar } from '@/features/erp/finance/expenses/bulk/BulkActionsToolbar'
import { useExpenseBulkActions } from '@/features/erp/finance/expenses/bulk/use-expense-bulk-actions'
import { ExpenseAdminTable } from '@/features/erp/finance/expenses/ExpenseAdminTable'
import type { ExpenseRowSelection } from '@/features/erp/finance/expenses/ExpenseAdminTable.types'
import { DEFAULT_EXPENSE_TABLE_CONFIG } from '@/features/erp/finance/expenses/config/default-expense-table.config'
import { ExpenseTableToolbar } from '@/features/erp/finance/expenses/filters/ExpenseTableToolbar'
import { buildExpenseQueryParams } from '@/features/erp/finance/expenses/data/query-builder'
import {
  filtersFromSearch,
  filtersToSearchPatch,
} from '@/features/erp/finance/expenses/data/search-params'
import { toExpenseRow } from '@/features/erp/finance/expenses/data/to-row'
import {
  useCreditCardsCatalog,
  useExpenseDocumentSignedUrls,
  useExpenseDocumentTypes,
  useExpenseStatuses,
  useExpenseTags,
  useExpenses,
  useUploadExpenseDocument,
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
  const documentTypesQuery = useExpenseDocumentTypes(companyId)
  const creditCardsQuery = useCreditCardsCatalog(companyId)
  const uploadDocumentMutation = useUploadExpenseDocument(companyId)
  const statuses = statusesQuery.data ?? []
  const documentTypes = documentTypesQuery.data ?? []

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

  const signDocumentItems = React.useMemo(
    () =>
      rows.flatMap((row) =>
        row.documents.map((document) => ({
          document,
          expenseId: row.id,
        })),
      ),
    [rows],
  )

  const signedUrlsQuery = useExpenseDocumentSignedUrls(
    companyId,
    signDocumentItems,
  )

  const signedUrlsByDocId = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const entry of signedUrlsQuery.data ?? []) {
      map.set(entry.documentId, entry.url)
    }
    return map
  }, [signedUrlsQuery.data])

  const creditCardsById = React.useMemo(() => {
    const map = new Map<
      string,
      import('@/lib/data/erp/expenses/types').CreditCardCatalogEntry
    >()
    for (const card of creditCardsQuery.data ?? []) {
      map.set(card.id, card)
    }
    return map
  }, [creditCardsQuery.data])
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

  const tableConfig = DEFAULT_EXPENSE_TABLE_CONFIG
  const bulkEnabled = tableConfig.bulkActionsEnabled !== false

  // Selection persists across page changes (Softr bulk behavior).
  const [selectedIds, setSelectedIds] = React.useState<ExpenseRowSelection>(
    () => new Set(),
  )

  const bulk = useExpenseBulkActions({
    companyId,
    selectedIds,
    onSelectionChange: setSelectedIds,
  })

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col p-4 lg:p-6">
      {isInitialLoading ? (
        <TableSkeleton />
      ) : expensesQuery.error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Couldn't load data
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {expensesQuery.error instanceof Error
              ? expensesQuery.error.message
              : 'Unknown error'}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="overflow-hidden rounded-md border">
          <ExpenseTableToolbar
            companyId={companyId}
            filters={filters}
            statuses={statuses}
            searchValue={searchInput}
            onSearchChange={(next) => {
              setSearchInput(next)
              commitSearch(next)
            }}
            onFiltersChange={applyFilters}
            onClearStructuredFilters={() =>
              applyFilters({
                ...filters,
                statusId: undefined,
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
          <EmptyState
            title="No results found"
            description={
              hasActiveFilters
                ? 'Try adjusting your filters.'
                : 'Records will appear here once created.'
            }
          />
        </div>
      ) : (
        <div
          className={cn(
            'relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden rounded-md border bg-card',
            isPaging ? 'opacity-60 transition-opacity' : undefined,
          )}
        >
          <div className="shrink-0">
          <ExpenseTableToolbar
            companyId={companyId}
            filters={filters}
            statuses={statuses}
            searchValue={searchInput}
            onSearchChange={(next) => {
              setSearchInput(next)
              commitSearch(next)
            }}
            onFiltersChange={applyFilters}
            onClearStructuredFilters={() =>
              applyFilters({
                ...filters,
                statusId: undefined,
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
          </div>

          {bulkEnabled && bulk.selectedCount > 0 ? (
            <div className="shrink-0">
            <BulkActionsToolbar
              selectedCount={bulk.selectedCount}
              selectedIds={bulk.selectedIdList}
              bulkActions={tableConfig.bulkActions ?? []}
              statuses={statuses}
              statusColors={tableConfig.statusColors}
              isLoading={bulk.isBulkLoading}
              onClear={bulk.clearSelection}
              onChangeStatus={bulk.handleChangeStatus}
              onExport={bulk.handleExport}
              onDelete={bulk.handleDelete}
            />
            </div>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ExpenseAdminTable
              companyId={companyId}
              config={tableConfig}
              rows={rows}
              statuses={statuses}
              sortColumn={sort}
              sortDirection={dir}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              documentTypes={documentTypes}
              signedUrlsByDocId={signedUrlsByDocId}
              creditCardsById={creditCardsById}
              isUploadingDocument={uploadDocumentMutation.isPending}
              onUploadDocument={(input) => uploadDocumentMutation.mutateAsync(input)}
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
          </div>

          <footer className="expense-table-footer mt-auto flex shrink-0 items-center justify-between gap-4 border-t border-border bg-muted/30 px-3.5 py-1.5 text-xs text-muted-foreground">
            <span className="tabular-nums">
              {total.toLocaleString()} rows
            </span>
            <div className="flex items-center gap-4">
              <span className="tabular-nums">
                Page <strong>{page}</strong> of <strong>{pageCount}</strong>
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
                  <IconChevronsLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={page <= 1 || isPaging}
                  onClick={() => setPage(Math.max(1, page - 1))}
                  aria-label="Previous page"
                >
                  <IconChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={page >= pageCount || isPaging}
                  onClick={() => setPage(Math.min(pageCount, page + 1))}
                  aria-label="Next page"
                >
                  <IconChevronRight className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={page >= pageCount || isPaging}
                  onClick={() => setPage(pageCount)}
                  aria-label="Last page"
                >
                  <IconChevronsRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </footer>
        </div>
      )}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b px-3 py-2">
        <div className="h-8 w-full max-w-xl animate-pulse rounded bg-muted" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b px-3 py-3 last:border-b-0"
        >
          <div className="size-4 animate-pulse rounded bg-muted" />
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
