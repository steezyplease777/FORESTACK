// @ts-nocheck

import * as React from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from '@/components/composites/data-table'
import { EmptyState } from '@/components/composites/empty-state'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { totalPages } from '@/lib/data/_shared/pagination'

import { AmountCell } from './cells/AmountCell'
import { StatusCell } from './cells/StatusCell'
import { TitleCell } from './cells/TitleCell'
import { buildExpenseQueryParams } from './data/query-builder'
import {
  formatExpenseAmount,
  formatExpenseDate,
  toExpenseRow,
} from './data/to-row'
import {
  useExpenseStatuses,
  useExpenses,
} from './data/use-expenses-query'
import { ExpenseTableToolbar } from './filters/ExpenseTableToolbar'
import type {
  ExpenseAdminTableProps,
  ExpenseRow,
  ExpenseTableColumnId,
} from './ExpenseAdminTable.types'

const COLUMN_LABELS: Record<ExpenseTableColumnId, string> = {
  title: 'Title',
  status: 'Status',
  amount: 'Amount',
  vendor: 'Vendor',
  expenseCategory: 'Category',
  submittedAt: 'Submitted',
  department: 'Department',
  relatedProject: 'Project',
}

export function ExpenseAdminTable({
  companyId,
  config,
  filters,
  page,
  pageSize,
  sortColumn,
  sortDirection,
  onFiltersChange,
  onPageChange,
  onSortChange,
  readOnly,
}: ExpenseAdminTableProps) {
  const queryParams = buildExpenseQueryParams(filters, sortColumn, sortDirection)
  const expensesQuery = useExpenses(companyId, {
    page,
    pageSize,
    ...queryParams,
  })
  const statusesQuery = useExpenseStatuses(companyId)

  const result = expensesQuery.data
  const rows = React.useMemo(
    () => (result?.rows ?? []).map(toExpenseRow),
    [result?.rows],
  )
  const total = result?.total ?? 0
  const pageCount = totalPages(total, pageSize)
  const statuses = statusesQuery.data ?? []
  const isPaging = expensesQuery.isPlaceholderData
  const isInitialLoading = expensesQuery.isLoading && !result

  const columns = React.useMemo<ColumnDef<ExpenseRow>[]>(() => {
    return config.columns.map((columnId) => {
      const label = COLUMN_LABELS[columnId]
      const sortable =
        columnId === 'title' ||
        columnId === 'amount' ||
        columnId === 'submittedAt'

      const header = sortable ? (
        <SortableHeader
          label={label}
          columnId={columnId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSortChange={onSortChange}
        />
      ) : (
        label
      )

      switch (columnId) {
        case 'title':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <TitleCell
                row={row.original}
                companyId={companyId}
                readOnly={readOnly}
              />
            ),
          }
        case 'status':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <StatusCell
                row={row.original}
                companyId={companyId}
                statuses={statuses}
                readOnly={readOnly}
              />
            ),
          }
        case 'amount':
          return {
            id: columnId,
            header,
            meta: { cellClassName: 'text-right', headClassName: 'text-right' },
            cell: ({ row }) => (
              <AmountCell
                row={row.original}
                companyId={companyId}
                readOnly={readOnly}
              />
            ),
          }
        case 'vendor':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.vendor || '—'}
              </span>
            ),
          }
        case 'expenseCategory':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.expenseCategory || '—'}
              </span>
            ),
          }
        case 'department':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.department || '—'}
              </span>
            ),
          }
        case 'relatedProject':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {row.original.relatedProject || '—'}
              </span>
            ),
          }
        case 'submittedAt':
          return {
            id: columnId,
            header,
            cell: ({ row }) => (
              <span className="text-muted-foreground">
                {formatExpenseDate(row.original.submittedAt)}
              </span>
            ),
          }
        default:
          return {
            id: columnId,
            header: label,
            cell: () => '—',
          }
      }
    })
  }, [
    companyId,
    config.columns,
    onSortChange,
    readOnly,
    sortColumn,
    sortDirection,
    statuses,
  ])

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-sm text-muted-foreground tabular-nums">
          {rows.length > 0 ? (
            <>
              Showing{' '}
              <span className="font-medium text-foreground">
                {(page - 1) * pageSize + 1}–
                {(page - 1) * pageSize + rows.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-foreground">
                {total.toLocaleString()}
              </span>
              {filters.q ? ` · filtered by "${filters.q}"` : ''}
            </>
          ) : (
            'No results'
          )}
        </p>
        <ExpenseTableToolbar
          filters={filters}
          statuses={statuses}
          onSearchChange={(q) => onFiltersChange({ q })}
          onStatusChange={(statusId) => onFiltersChange({ statusId })}
        />
      </div>

      <CardContent className="p-0">
        {isInitialLoading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            Loading expenses…
          </p>
        ) : expensesQuery.error ? (
          <p className="py-20 text-center text-sm text-destructive">
            {expensesQuery.error instanceof Error
              ? expensesQuery.error.message
              : 'Failed to load expenses'}
          </p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No expenses found"
            description={
              filters.q || filters.statusId
                ? 'Try adjusting your filters.'
                : 'Expenses will appear here once created.'
            }
          />
        ) : (
          <div
            className={cn(
              isPaging ? 'opacity-60 transition-opacity' : undefined,
            )}
          >
            <DataTable
              columns={columns}
              data={rows}
              className="rounded-none border-0 bg-transparent"
              rowClassName="group"
            />
          </div>
        )}
      </CardContent>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between gap-4 border-t px-4 py-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {pageCount} · {pageSize} per page
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || expensesQuery.isFetching}
              onClick={() => onPageChange(page - 1)}
            >
              <IconChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pageCount || expensesQuery.isFetching}
              onClick={() => onPageChange(page + 1)}
            >
              Next
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}

function SortableHeader({
  label,
  columnId,
  sortColumn,
  sortDirection,
  onSortChange,
}: {
  label: string
  columnId: ExpenseTableColumnId
  sortColumn: ExpenseAdminTableProps['sortColumn']
  sortDirection: ExpenseAdminTableProps['sortDirection']
  onSortChange: ExpenseAdminTableProps['onSortChange']
}) {
  const resolved =
    columnId === 'submittedAt'
      ? 'created_at'
      : columnId === 'title' || columnId === 'amount'
        ? columnId
        : null

  if (!resolved) return label

  const active = sortColumn === resolved
  const nextDir = active && sortDirection === 'desc' ? 'asc' : 'desc'

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-medium hover:underline"
      onClick={() => onSortChange(resolved, nextDir)}
    >
      {label}
      {active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : null}
    </button>
  )
}

// re-export for column footer totals if needed later
export { formatExpenseAmount }
