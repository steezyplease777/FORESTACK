// @ts-nocheck

import * as React from 'react'
import {
  IconArrowDown,
  IconArrowUp,
} from '@tabler/icons-react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { AmountCell } from './cells/AmountCell'
import { DateCell } from './cells/DateCell'
import { DocumentsCell } from './cells/DocumentsCell'
import { PaymentTypeCell } from './cells/PaymentTypeCell'
import { RowActionsCell } from './cells/RowActionsCell'
import { StatusCell } from './cells/StatusCell'
import { SubmittedByCell } from './cells/SubmittedByCell'
import { TagsCell } from './cells/TagsCell'
import { TitleCell } from './cells/TitleCell'
import { VendorCell } from './cells/VendorCell'
import {
  EXPENSE_ACTIONS_COLUMN_WIDTH,
  EXPENSE_CHECKBOX_COLUMN_WIDTH,
  EXPENSE_COLUMN_DEFS,
  expenseTableMinWidth,
} from './config/column-defs'
import {
  formatExpenseAmount,
  formatExpenseDate,
} from './data/to-row'
import type {
  ExpenseAdminTableProps,
  ExpenseRow,
  ExpenseTableColumnId,
  ExpenseTableConfig,
} from './ExpenseAdminTable.types'

const SORTABLE_COLUMN_MAP: Partial<
  Record<ExpenseTableColumnId, 'created_at' | 'title' | 'amount'>
> = {
  title: 'title',
  amount: 'amount',
  submittedAt: 'created_at',
}

const thClass =
  'sticky top-0 z-[3] border-b border-r border-border/70 bg-background px-2 py-2 text-xs font-medium text-foreground last:border-r-0'
const tdClass =
  'h-12 overflow-hidden border-b border-r border-border/70 px-2 align-middle last:border-r-0'
const checkboxThClass =
  'sticky top-0 z-[3] w-10 border-b border-r-0 border-border/70 bg-background px-2 py-2 text-center'
const checkboxTdClass =
  'h-12 w-10 border-b border-r-0 border-border/70 px-2 text-center align-middle'

export function ExpenseAdminTable({
  companyId,
  config,
  rows,
  statuses,
  sortColumn,
  sortDirection,
  onSortChange,
  readOnly,
  selectedIds: selectedIdsProp,
  onSelectionChange,
}: ExpenseAdminTableProps) {
  const columns = config.columns
  const tableMinWidth = expenseTableMinWidth(columns)
  const bulkEnabled = config.bulkActionsEnabled !== false && !readOnly

  const [internalSelectedIds, setInternalSelectedIds] = React.useState<
    Set<string>
  >(new Set())
  const selectedIds = selectedIdsProp ?? internalSelectedIds
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds

  const pageRowIds = React.useMemo(() => rows.map((r) => r.id), [rows])
  const allSelected =
    bulkEnabled &&
    pageRowIds.length > 0 &&
    pageRowIds.every((id) => selectedIds.has(id))
  const someSelected =
    bulkEnabled &&
    !allSelected &&
    pageRowIds.some((id) => selectedIds.has(id))

  const toggleAll = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        for (const id of pageRowIds) next.add(id)
      } else {
        for (const id of pageRowIds) next.delete(id)
      }
      return next
    })
  }

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="overflow-x-auto">
    <table
      className="expense-grid-table border-separate border-spacing-0 text-sm"
      style={{ minWidth: tableMinWidth }}
    >
      <colgroup>
        {bulkEnabled ? (
          <col
            style={{
              width: EXPENSE_CHECKBOX_COLUMN_WIDTH,
              minWidth: EXPENSE_CHECKBOX_COLUMN_WIDTH,
            }}
          />
        ) : null}
        {columns.map((columnId) => {
          const minWidth = EXPENSE_COLUMN_DEFS[columnId]?.width ?? 100
          return <col key={columnId} style={{ minWidth }} />
        })}
        <col
          style={{
            width: EXPENSE_ACTIONS_COLUMN_WIDTH,
            minWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
          }}
        />
      </colgroup>
      <thead>
        <tr className="hover:bg-transparent">
          {bulkEnabled ? (
            <th
              className={checkboxThClass}
              style={{
                width: EXPENSE_CHECKBOX_COLUMN_WIDTH,
                minWidth: EXPENSE_CHECKBOX_COLUMN_WIDTH,
              }}
            >
              <Checkbox
                checked={
                  allSelected ? true : someSelected ? 'indeterminate' : false
                }
                onCheckedChange={(v) => toggleAll(!!v)}
                aria-label="Select all rows on this page"
              />
            </th>
          ) : null}
          {columns.map((columnId) => {
            const def = EXPENSE_COLUMN_DEFS[columnId]
            const label = def?.label ?? columnId
            const sortable = config.sortableColumns.includes(columnId)
            const alignRight = def?.align === 'right'
            const resolvedSort = SORTABLE_COLUMN_MAP[columnId]
            const HeaderIcon = def?.icon

            return (
              <th
                key={columnId}
                className={cn(thClass, alignRight && 'text-right')}
                style={{ minWidth: def?.width ?? 100 }}
              >
                {sortable && resolvedSort ? (
                  <SortableHeader
                    label={label}
                    icon={HeaderIcon}
                    resolvedSort={resolvedSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSortChange={onSortChange}
                    alignRight={alignRight}
                  />
                ) : (
                  <StaticHeader label={label} icon={HeaderIcon} alignRight={alignRight} />
                )}
              </th>
            )
          })}
          <th
            className={cn(thClass, 'text-center')}
            style={{
              width: EXPENSE_ACTIONS_COLUMN_WIDTH,
              minWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
            }}
            aria-label="Row actions"
          />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className={cn(
              'transition-colors hover:bg-muted/40',
              bulkEnabled && selectedIds.has(row.id) && 'bg-muted/30',
            )}
          >
            {bulkEnabled ? (
              <td
                className={checkboxTdClass}
                style={{
                  width: EXPENSE_CHECKBOX_COLUMN_WIDTH,
                  minWidth: EXPENSE_CHECKBOX_COLUMN_WIDTH,
                }}
              >
                <Checkbox
                  checked={selectedIds.has(row.id)}
                  onCheckedChange={(v) => toggleRow(row.id, !!v)}
                  aria-label={`Select row ${row.title || row.id}`}
                />
              </td>
            ) : null}
            {columns.map((columnId) => {
              const def = EXPENSE_COLUMN_DEFS[columnId]
              const alignRight = def?.align === 'right'

              return (
                <td
                  key={columnId}
                  className={cn(tdClass, alignRight && 'text-right')}
                  style={{ minWidth: def?.width ?? 100 }}
                >
                  <ExpenseCell
                    columnId={columnId}
                    row={row}
                    companyId={companyId}
                    statuses={statuses}
                    config={config}
                    readOnly={readOnly}
                  />
                </td>
              )
            })}
            <td
              className={cn(tdClass, 'text-center')}
              style={{
                width: EXPENSE_ACTIONS_COLUMN_WIDTH,
                minWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
              }}
            >
              <RowActionsCell row={row} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

function StaticHeader({
  label,
  icon: Icon,
  alignRight,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  alignRight?: boolean
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5',
        alignRight && 'justify-end',
      )}
    >
      {Icon ? <Icon className="size-3 shrink-0 opacity-80" /> : null}
      <span className="truncate">{label}</span>
    </div>
  )
}

function SortableHeader({
  label,
  icon: Icon,
  resolvedSort,
  sortColumn,
  sortDirection,
  onSortChange,
  alignRight,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  resolvedSort: 'created_at' | 'title' | 'amount'
  sortColumn: ExpenseAdminTableProps['sortColumn']
  sortDirection: ExpenseAdminTableProps['sortDirection']
  onSortChange: ExpenseAdminTableProps['onSortChange']
  alignRight?: boolean
}) {
  const active = sortColumn === resolvedSort
  const nextDir = active && sortDirection === 'desc' ? 'asc' : 'desc'

  return (
    <button
      type="button"
      className={cn(
        'flex min-w-0 w-full items-center gap-1.5 text-left',
        alignRight && 'justify-end',
      )}
      onClick={() => onSortChange(resolvedSort, nextDir)}
    >
      {Icon ? <Icon className="size-3 shrink-0 opacity-80" /> : null}
      <span className="truncate">{label}</span>
      <span className={cn('shrink-0', active ? 'opacity-100' : 'opacity-30')}>
        {active && sortDirection === 'asc' ? (
          <IconArrowUp className="size-3" />
        ) : (
          <IconArrowDown className="size-3" />
        )}
      </span>
    </button>
  )
}

function ExpenseCell({
  columnId,
  row,
  companyId,
  statuses,
  config,
  readOnly,
}: {
  columnId: ExpenseTableColumnId
  row: ExpenseRow
  companyId: string
  statuses: ExpenseStatus[]
  config: ExpenseTableConfig
  readOnly?: boolean
}) {
  switch (columnId) {
    case 'submittedBy':
      return <SubmittedByCell row={row} />
    case 'title':
      return (
        <TitleCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'status':
      return (
        <StatusCell
          row={row}
          companyId={companyId}
          statuses={statuses}
          statusColors={config.statusColors}
          readOnly={readOnly}
        />
      )
    case 'amount':
      return (
        <AmountCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'vendor':
      return (
        <VendorCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'expenseCategory':
      return (
        <span className="block truncate text-sm text-foreground">
          {row.expenseCategory || '—'}
        </span>
      )
    case 'department':
      return (
        <span className="block truncate text-sm text-foreground">
          {row.department || '—'}
        </span>
      )
    case 'relatedProject':
      return (
        <span className="block truncate text-sm text-foreground">
          {row.relatedProject || '—'}
        </span>
      )
    case 'invoiceTags':
      return <TagsCell row={row} />
    case 'documents':
      return <DocumentsCell row={row} />
    case 'paymentType':
      return (
        <PaymentTypeCell
          label={row.paymentType}
          colors={config.paymentTypeColors}
        />
      )
    case 'invoiceDate':
      return <DateCell value={row.invoiceDate} />
    case 'submittedAt':
      return <DateCell value={row.submittedAt} />
    default:
      return '—'
  }
}

export { formatExpenseAmount, formatExpenseDate }
