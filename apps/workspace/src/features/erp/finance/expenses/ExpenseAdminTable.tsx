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
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { AmountCell } from './cells/AmountCell'
import { StatusCell } from './cells/StatusCell'
import { TitleCell } from './cells/TitleCell'
import {
  formatExpenseAmount,
  formatExpenseDate,
} from './data/to-row'
import type {
  ExpenseAdminTableProps,
  ExpenseRow,
  ExpenseTableColumnId,
} from './ExpenseAdminTable.types'

const COLUMN_LABELS: Record<ExpenseTableColumnId, string> = {
  title: 'Expense',
  status: 'Status',
  amount: 'Amount',
  vendor: 'Vendor',
  expenseCategory: 'Category',
  submittedAt: 'Submitted',
  department: 'Department',
  relatedProject: 'Project',
}

const COLUMN_WIDTHS: Partial<Record<ExpenseTableColumnId, string>> = {
  title: 'w-[30%]',
  status: 'w-[12%]',
  amount: 'w-[10%]',
  vendor: 'w-[16%]',
  expenseCategory: 'w-[14%]',
  submittedAt: 'w-[12%]',
  department: 'w-[12%]',
  relatedProject: 'w-[14%]',
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
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          {config.columns.map((columnId) => {
            const label = COLUMN_LABELS[columnId]
            const sortable =
              columnId === 'title' ||
              columnId === 'amount' ||
              columnId === 'submittedAt'
            const alignRight = columnId === 'amount'

            return (
              <TableHead
                key={columnId}
                className={`${COLUMN_WIDTHS[columnId] ?? ''} ${alignRight ? 'text-right' : ''}`}
              >
                {sortable ? (
                  <SortableHeader
                    label={label}
                    columnId={columnId}
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
          <TableRow key={row.id} className="group h-16">
            {config.columns.map((columnId) => (
              <TableCell
                key={columnId}
                className={columnId === 'amount' ? 'text-right' : undefined}
              >
                <ExpenseCell
                  columnId={columnId}
                  row={row}
                  companyId={companyId}
                  statuses={statuses}
                  readOnly={readOnly}
                />
              </TableCell>
            ))}
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
  readOnly,
}: {
  columnId: ExpenseTableColumnId
  row: ExpenseRow
  companyId: string
  statuses: ExpenseStatus[]
  readOnly?: boolean
}) {
  switch (columnId) {
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
          readOnly={readOnly}
        />
      )
    case 'amount':
      return (
        <AmountCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'vendor':
      return (
        <span className="truncate text-sm">{row.vendor || '—'}</span>
      )
    case 'expenseCategory':
      return row.expenseCategory ? (
        <span className="truncate text-xs text-muted-foreground">
          {row.expenseCategory}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )
    case 'department':
      return (
        <span className="truncate text-xs text-muted-foreground">
          {row.department || '—'}
        </span>
      )
    case 'relatedProject':
      return (
        <span className="block max-w-full truncate text-xs text-muted-foreground">
          {row.relatedProject || '—'}
        </span>
      )
    case 'submittedAt':
      return (
        <span className="text-xs text-muted-foreground">
          {formatExpenseDate(row.submittedAt)}
        </span>
      )
    default:
      return '—'
  }
}

function SortableHeader({
  label,
  columnId,
  sortColumn,
  sortDirection,
  onSortChange,
  alignRight,
}: {
  label: string
  columnId: ExpenseTableColumnId
  sortColumn: ExpenseAdminTableProps['sortColumn']
  sortDirection: ExpenseAdminTableProps['sortDirection']
  onSortChange: ExpenseAdminTableProps['onSortChange']
  alignRight?: boolean
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
      className={`inline-flex items-center gap-1 ${alignRight ? 'ml-auto' : ''}`}
      onClick={() => onSortChange(resolved, nextDir)}
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

export { formatExpenseAmount }
