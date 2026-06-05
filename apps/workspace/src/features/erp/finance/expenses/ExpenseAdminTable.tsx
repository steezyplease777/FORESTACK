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
import { CategoryCell } from './cells/CategoryCell'
import { DateCell } from './cells/DateCell'
import { DocumentsCell } from './cells/DocumentsCell'
import { PaymentTypeCell } from './cells/PaymentTypeCell'
import { StatusCell } from './cells/StatusCell'
import { TagsCell } from './cells/TagsCell'
import { TitleCell } from './cells/TitleCell'
import { VendorCell } from './cells/VendorCell'
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

const COLUMN_LABELS: Record<ExpenseTableColumnId, string> = {
  title: 'Expense',
  status: 'Status',
  amount: 'Amount',
  vendor: 'Vendor',
  expenseCategory: 'Category',
  submittedAt: 'Submitted',
  department: 'Department',
  relatedProject: 'Project',
  invoiceTags: 'Tags',
  documents: 'Documents',
  paymentType: 'Payment type',
  invoiceDate: 'Invoice date',
}

const COLUMN_WIDTHS: Partial<Record<ExpenseTableColumnId, string>> = {
  title: 'w-[24%]',
  status: 'w-[11%]',
  amount: 'w-[9%]',
  vendor: 'w-[12%]',
  expenseCategory: 'w-[11%]',
  submittedAt: 'w-[9%]',
  department: 'w-[10%]',
  relatedProject: 'w-[11%]',
  invoiceTags: 'w-[10%]',
  documents: 'w-[9%]',
  paymentType: 'w-[10%]',
  invoiceDate: 'w-[9%]',
}

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

  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          {columns.map((columnId) => {
            const label = COLUMN_LABELS[columnId]
            const sortable = config.sortableColumns.includes(columnId)
            const alignRight = columnId === 'amount'
            const resolvedSort = SORTABLE_COLUMN_MAP[columnId]

            return (
              <TableHead
                key={columnId}
                className={`${COLUMN_WIDTHS[columnId] ?? ''} ${alignRight ? 'text-right' : ''}`}
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
          <TableRow key={row.id} className="group h-16">
            {columns.map((columnId) => (
              <TableCell
                key={columnId}
                className={columnId === 'amount' ? 'text-right' : undefined}
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
      className={`inline-flex items-center gap-1 ${alignRight ? 'ml-auto' : ''}`}
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
