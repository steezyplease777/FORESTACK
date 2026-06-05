// @ts-nocheck

import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  IconArrowDown,
  IconArrowUp,
} from '@tabler/icons-react'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { AmountCell } from './cells/AmountCell'
import { AttributesCell } from './cells/AttributesCell'
import { CategoryCell } from './cells/CategoryCell'
import { DateCell } from './cells/DateCell'
import { DepartmentCell } from './cells/DepartmentCell'
import { DirectionCell } from './cells/DirectionCell'
import { DocumentsCell } from './cells/DocumentsCell'
import { DocumentUploadDialog } from './documents/DocumentUploadDialog'
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
} from './config/column-defs'
import {
  expenseTableTotalWidth,
  useColumnResize,
} from './hooks/use-column-resize'
import { useScrollbarReveal } from './hooks/use-scrollbar-reveal'
import './scrollbar-auto-hide.css'
import {
  sortColumnForTableColumn,
  type ExpenseSortColumn,
} from './data/field-map'
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

/** Fixed row height — matches `h-12` cells and virtualizer `estimateSize`. */
export const EXPENSE_ROW_HEIGHT = 48

const thClass =
  'sticky top-0 z-10 border-b border-r border-border/70 bg-card px-2 py-2 text-xs font-normal text-foreground'
const tdClass =
  'h-12 overflow-hidden border-r border-border/70 bg-card px-2 align-middle'
/** HoverCard triggers must not be clipped by the cell. */
const HOVER_CARD_COLUMN_IDS = new Set<ExpenseTableColumnId>([
  'attributes',
  'invoiceTags',
])
const checkboxThClass =
  'sticky top-0 z-10 w-10 border-b border-r-0 border-border/70 bg-card px-2 py-2 text-center'
const checkboxTdClass =
  'h-12 w-10 border-r-0 border-border/70 bg-card px-2 text-center align-middle'
/** Opaque hover/selection fills — mix from --card so cream panel never bleeds through. */
const rowHoverBg =
  'group-hover:bg-[color-mix(in_srgb,var(--muted)_40%,var(--card))]'
const rowSelectedBg =
  'bg-[color-mix(in_srgb,var(--muted)_30%,var(--card))]'
/** Sticky right actions column — solid bg + left edge so scrolled cells don't bleed through. */
const actionsThClass = cn(
  thClass,
  'sticky right-0 z-30 border-l border-r-0 border-border text-center',
)
const actionsTdClass = cn(
  tdClass,
  'sticky right-0 z-20 border-l border-r-0 border-border text-center',
  rowHoverBg,
)

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
  documentTypes = [],
  signedUrlsByDocId,
  onUploadDocument,
  isUploadingDocument = false,
  creditCardsById,
}: ExpenseAdminTableProps) {
  const columns = config.columns
  const bulkEnabled = config.bulkActionsEnabled !== false && !readOnly
  const {
    columnWidths,
    columnSizeVars,
    resizingColumn,
    getResizeHandler,
  } = useColumnResize(columns)
  const tableMinWidth = expenseTableTotalWidth(columns, columnWidths, {
    bulkEnabled,
  })

  const [internalSelectedIds, setInternalSelectedIds] = React.useState<
    Set<string>
  >(new Set())
  const selectedIds = selectedIdsProp ?? internalSelectedIds
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { onScroll: onScrollbarReveal } = useScrollbarReveal(scrollRef)

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => EXPENSE_ROW_HEIGHT,
    overscan: 10,
    getItemKey: (index) => rows[index]?.id ?? index,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalVirtualSize = virtualizer.getTotalSize()
  const topPadding =
    virtualItems.length > 0 ? virtualItems[0].start : 0
  const bottomPadding =
    virtualItems.length > 0
      ? totalVirtualSize - virtualItems[virtualItems.length - 1].end
      : 0

  const colSpan = (bulkEnabled ? 1 : 0) + columns.length + 1

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

  const uploadEnabled =
    !readOnly && documentTypes.length > 0 && typeof onUploadDocument === 'function'

  const [pendingUpload, setPendingUpload] = React.useState<{
    expenseId: string
    file: File
  } | null>(null)

  const handleDropFile = React.useCallback(
    (expenseId: string, file: File) => {
      if (!uploadEnabled) return
      setPendingUpload({ expenseId, file })
    },
    [uploadEnabled],
  )

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col font-sans">
      <div
        ref={scrollRef}
        className="scrollbar-auto-hide min-h-0 min-w-0 flex-1 overflow-auto"
        onScroll={onScrollbarReveal}
      >
        <table
          className={cn(
            'expense-grid-table w-full border-separate border-spacing-0 font-sans text-sm font-normal',
            resizingColumn && 'cursor-col-resize select-none',
          )}
          style={{
            ...columnSizeVars,
            width: tableMinWidth,
            minWidth: '100%',
            tableLayout: 'fixed',
          }}
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
            {columns.map((columnId) => (
              <col
                key={columnId}
                style={{
                  width: `calc(var(--col-${columnId}-size) * 1px)`,
                  minWidth: EXPENSE_COLUMN_DEFS[columnId]?.width ?? 100,
                }}
              />
            ))}
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
                const resolvedSort = sortColumnForTableColumn(columnId)
                const HeaderIcon = def?.icon

                return (
                  <th
                    key={columnId}
                    className={cn(
                      thClass,
                      'relative',
                      alignRight && 'text-right',
                    )}
                    style={{
                      width: `calc(var(--col-${columnId}-size) * 1px)`,
                      minWidth: def?.width ?? 100,
                    }}
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
                      <StaticHeader
                        label={label}
                        icon={HeaderIcon}
                        alignRight={alignRight}
                      />
                    )}
                    <ColumnResizeHandle
                      columnId={columnId}
                      isResizing={resizingColumn === columnId}
                      onResizeStart={getResizeHandler(columnId)}
                    />
                  </th>
                )
              })}
              <th
                className={actionsThClass}
                style={{
                  width: EXPENSE_ACTIONS_COLUMN_WIDTH,
                  minWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
                }}
                aria-label="Row actions"
              />
            </tr>
          </thead>
          <tbody style={{ height: totalVirtualSize }}>
            {topPadding > 0 ? (
              <tr aria-hidden style={{ height: topPadding }}>
                <td colSpan={colSpan} style={{ padding: 0, border: 'none' }} />
              </tr>
            ) : null}
            {virtualItems.map((virtualRow) => {
              const row = rows[virtualRow.index]
              if (!row) return null

              return (
                <ExpenseTableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  columnWidths={columnWidths}
                  companyId={companyId}
                  statuses={statuses}
                  config={config}
                  readOnly={readOnly}
                  bulkEnabled={bulkEnabled}
                  selected={selectedIds.has(row.id)}
                  onToggleRow={toggleRow}
                  uploadEnabled={uploadEnabled}
                  signedUrlsByDocId={signedUrlsByDocId}
                  creditCardsById={creditCardsById}
                  onDropFile={handleDropFile}
                  style={{ height: virtualRow.size }}
                />
              )
            })}
            {bottomPadding > 0 ? (
              <tr aria-hidden style={{ height: bottomPadding }}>
                <td colSpan={colSpan} style={{ padding: 0, border: 'none' }} />
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <DocumentUploadDialog
        open={!!pendingUpload}
        expenseId={pendingUpload?.expenseId ?? ''}
        companyId={companyId}
        file={pendingUpload?.file ?? null}
        documentTypes={documentTypes}
        isSubmitting={isUploadingDocument}
        onClose={() => setPendingUpload(null)}
        onSubmit={async (input) => {
          if (!onUploadDocument) return
          await onUploadDocument(input)
          setPendingUpload(null)
        }}
      />
    </div>
  )
}

function ColumnResizeHandle({
  columnId,
  isResizing,
  onResizeStart,
}: {
  columnId: ExpenseTableColumnId
  isResizing: boolean
  onResizeStart: (e: React.MouseEvent | React.TouchEvent) => void
}) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${EXPENSE_COLUMN_DEFS[columnId]?.label ?? columnId} column`}
      className={cn(
        'absolute top-0 right-0 z-[5] h-full w-2 -mr-1 cursor-col-resize touch-none select-none',
        'after:absolute after:top-0 after:left-1/2 after:h-full after:w-px after:-translate-x-1/2 after:bg-transparent after:transition-colors',
        'hover:after:bg-primary',
        isResizing && 'after:bg-primary after:h-screen',
      )}
      onMouseDown={onResizeStart}
      onTouchStart={onResizeStart}
    />
  )
}

function ExpenseTableRow({
  row,
  columns,
  columnWidths,
  companyId,
  statuses,
  config,
  readOnly,
  bulkEnabled,
  selected,
  onToggleRow,
  uploadEnabled,
  signedUrlsByDocId,
  creditCardsById,
  onDropFile,
  style,
}: {
  row: ExpenseRow
  columns: ExpenseTableColumnId[]
  columnWidths: Record<ExpenseTableColumnId, number>
  companyId: string
  statuses: ExpenseStatus[]
  config: ExpenseTableConfig
  readOnly?: boolean
  bulkEnabled: boolean
  selected: boolean
  onToggleRow: (id: string, checked: boolean) => void
  uploadEnabled?: boolean
  signedUrlsByDocId?: Map<string, string>
  creditCardsById?: Map<string, import('@/lib/data/erp/expenses/types').CreditCardCatalogEntry>
  onDropFile?: (expenseId: string, file: File) => void
  style?: React.CSSProperties
}) {
  return (
    <tr className="group transition-colors" style={style}>
      {bulkEnabled ? (
        <td
          className={cn(
            checkboxTdClass,
            rowHoverBg,
            selected && rowSelectedBg,
          )}
          style={{
            width: EXPENSE_CHECKBOX_COLUMN_WIDTH,
            minWidth: EXPENSE_CHECKBOX_COLUMN_WIDTH,
          }}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onToggleRow(row.id, !!v)}
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
            className={cn(
              tdClass,
              rowHoverBg,
              bulkEnabled && selected && rowSelectedBg,
              HOVER_CARD_COLUMN_IDS.has(columnId) && 'overflow-visible',
              alignRight && 'text-right',
            )}
            style={{
              width: `calc(var(--col-${columnId}-size) * 1px)`,
              minWidth: def?.width ?? 100,
            }}
          >
            <ExpenseCell
              columnId={columnId}
              row={row}
              companyId={companyId}
              statuses={statuses}
              config={config}
              readOnly={readOnly}
              uploadEnabled={uploadEnabled}
              signedUrlsByDocId={signedUrlsByDocId}
              creditCardsById={creditCardsById}
              onDropFile={onDropFile}
            />
          </td>
        )
      })}
      <td
        className={cn(
          actionsTdClass,
          bulkEnabled && selected && rowSelectedBg,
        )}
        style={{
          width: EXPENSE_ACTIONS_COLUMN_WIDTH,
          minWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
        }}
      >
        <RowActionsCell row={row} />
      </td>
    </tr>
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
  resolvedSort: ExpenseSortColumn
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
  uploadEnabled,
  signedUrlsByDocId,
  creditCardsById,
  onDropFile,
}: {
  columnId: ExpenseTableColumnId
  row: ExpenseRow
  companyId: string
  statuses: ExpenseStatus[]
  config: ExpenseTableConfig
  readOnly?: boolean
  uploadEnabled?: boolean
  signedUrlsByDocId?: Map<string, string>
  creditCardsById?: Map<string, import('@/lib/data/erp/expenses/types').CreditCardCatalogEntry>
  onDropFile?: (expenseId: string, file: File) => void
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
        <DepartmentCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'relatedProject':
      return (
        <span className="block truncate text-sm text-foreground">
          {row.relatedProject || '—'}
        </span>
      )
    case 'invoiceTags':
      return (
        <TagsCell row={row} companyId={companyId} readOnly={readOnly} />
      )
    case 'documents':
      return (
        <DocumentsCell
          row={row}
          readOnly={readOnly}
          uploadEnabled={uploadEnabled}
          signedUrlsByDocId={signedUrlsByDocId}
          onDropFile={onDropFile}
        />
      )
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
    case 'direction':
      return <DirectionCell direction={row.direction} />
    case 'attributes':
      return (
        <AttributesCell
          attributes={row.attributes}
          creditCardsById={creditCardsById}
        />
      )
    default:
      return '—'
  }
}

export { formatExpenseAmount, formatExpenseDate }
