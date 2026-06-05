// @ts-nocheck

import * as React from 'react'
import {
  IconArrowDown,
  IconArrowUp,
  IconArrowsSort,
} from '@tabler/icons-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { AmountCell } from './cells/AmountCell'
import { CategoryCell } from './cells/CategoryCell'
import { DateCell } from './cells/DateCell'
import { DocumentsCell } from './cells/DocumentsCell'
import { PaymentTypeCell } from './cells/PaymentTypeCell'
import { StatusCell } from './cells/StatusCell'
import { SubmittedByCell } from './cells/SubmittedByCell'
import { TagsCell } from './cells/TagsCell'
import { TitleCell } from './cells/TitleCell'
import { VendorCell } from './cells/VendorCell'
import {
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

export function ExpenseAdminTable({
  companyId,
  config,
  rows,
  statuses,
  sortColumn,
  sortDirection,
  onSortChange,
  readOnly,
}: ExpenseAdminTableProps) {
  const columns = config.columns
  const tableMinWidth = expenseTableMinWidth(columns)

  return (
    <Table
      className="table-fixed border-0"
      style={{ minWidth: tableMinWidth }}
    >
      <colgroup>
        {columns.map((columnId) => (
          <col
            key={columnId}
            style={{ width: EXPENSE_COLUMN_DEFS[columnId]?.width ?? 100 }}
          />
        ))}
      </colgroup>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((columnId) => {
            const def = EXPENSE_COLUMN_DEFS[columnId]
            const label = def?.label ?? columnId
            const sortable = config.sortableColumns.includes(columnId)
            const alignRight = def?.align === 'right'
            const resolvedSort = SORTABLE_COLUMN_MAP[columnId]

            return (
              <TableHead
                key={columnId}
                className={cn(
                  'bg-muted/30 text-xs font-medium',
                  alignRight && 'text-right',
                )}
              >
                {sortable && resolvedSort ? (
                  <SortableHeader
                    label={label}
                    resolvedSort={resolvedSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    onSortChange={onSortChange}
                    alignRight={alignRight}
                  />
                ) : (
                  label
                )}
              </TableHead>
            )
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id} className="group">
            {columns.map((columnId) => {
              const def = EXPENSE_COLUMN_DEFS[columnId]
              const alignRight = def?.align === 'right'

              return (
                <TableCell
                  key={columnId}
                  className={cn(
                    'max-w-0 overflow-hidden py-2.5',
                    alignRight && 'text-right',
                  )}
                >
                  <ExpenseCell
                    columnId={columnId}
                    row={row}
                    companyId={companyId}
                    statuses={statuses}
                    config={config}
                    readOnly={readOnly}
                  />
                </TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
        <CategoryCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'department':
      return (
        <span className="block truncate text-xs text-muted-foreground">
          {row.department || '—'}
        </span>
      )
    case 'relatedProject':
      return (
        <span className="block truncate text-xs text-muted-foreground">
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

function SortableHeader({
  label,
  resolvedSort,
  sortColumn,
  sortDirection,
  onSortChange,
  alignRight,
}: {
  label: string
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
        'inline-flex items-center gap-1',
        alignRight && 'ml-auto',
      )}
      onClick={() => onSortChange(resolvedSort, nextDir)}
    >
      {label}
      {active ? (
        sortDirection === 'asc' ? (
          <IconArrowUp className="size-3.5" />
        ) : (
          <IconArrowDown className="size-3.5" />
        )
      ) : (
        <IconArrowsSort className="size-3.5 opacity-40" />
      )}
    </button>
  )
}

export { formatExpenseAmount, formatExpenseDate }
