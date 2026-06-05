import * as React from 'react'

import {
  EXPENSE_ACTIONS_COLUMN_WIDTH,
  EXPENSE_CHECKBOX_COLUMN_WIDTH,
  EXPENSE_COLUMN_DEFS,
} from '../config/column-defs'
import type { ExpenseTableColumnId } from '../ExpenseAdminTable.types'

function defaultWidthsForColumns(
  columns: ExpenseTableColumnId[],
): Record<ExpenseTableColumnId, number> {
  const widths = {} as Record<ExpenseTableColumnId, number>
  for (const id of columns) {
    widths[id] = EXPENSE_COLUMN_DEFS[id]?.width ?? 100
  }
  return widths
}

export function expenseTableTotalWidth(
  columns: ExpenseTableColumnId[],
  columnWidths: Record<ExpenseTableColumnId, number>,
  options?: { bulkEnabled?: boolean },
): number {
  const checkbox =
    options?.bulkEnabled !== false ? EXPENSE_CHECKBOX_COLUMN_WIDTH : 0
  return (
    checkbox +
    EXPENSE_ACTIONS_COLUMN_WIDTH +
    columns.reduce((sum, id) => sum + (columnWidths[id] ?? 100), 0)
  )
}

/**
 * Session-scoped column widths with drag handles (Softr/TanStack onChange parity).
 * Widths are stored as unitless CSS variables: `calc(var(--col-X-size) * 1px)`.
 */
export function useColumnResize(columns: ExpenseTableColumnId[]) {
  const [columnWidths, setColumnWidths] = React.useState<
    Record<ExpenseTableColumnId, number>
  >(() => defaultWidthsForColumns(columns))

  const [resizingColumn, setResizingColumn] =
    React.useState<ExpenseTableColumnId | null>(null)

  React.useEffect(() => {
    setColumnWidths((prev) => {
      const next = { ...prev }
      let changed = false
      for (const id of columns) {
        if (next[id] == null) {
          next[id] = EXPENSE_COLUMN_DEFS[id]?.width ?? 100
          changed = true
        }
      }
      for (const id of Object.keys(next) as ExpenseTableColumnId[]) {
        if (!columns.includes(id)) {
          delete next[id]
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [columns])

  const getMinWidth = React.useCallback(
    (columnId: ExpenseTableColumnId) =>
      EXPENSE_COLUMN_DEFS[columnId]?.width ?? 100,
    [],
  )

  const getColumnWidth = React.useCallback(
    (columnId: ExpenseTableColumnId) =>
      columnWidths[columnId] ?? getMinWidth(columnId),
    [columnWidths, getMinWidth],
  )

  const columnSizeVars = React.useMemo(() => {
    const vars: Record<string, number> = {}
    for (const id of columns) {
      vars[`--col-${id}-size`] = getColumnWidth(id)
    }
    return vars
  }, [columns, getColumnWidth])

  const startResize = React.useCallback(
    (columnId: ExpenseTableColumnId, clientX: number) => {
      const startWidth = getColumnWidth(columnId)
      const minWidth = getMinWidth(columnId)
      setResizingColumn(columnId)

      const onMove = (e: MouseEvent | TouchEvent) => {
        const x = 'touches' in e ? e.touches[0]?.clientX : e.clientX
        if (x == null) return
        const delta = x - clientX
        setColumnWidths((prev) => ({
          ...prev,
          [columnId]: Math.max(minWidth, startWidth + delta),
        }))
      }

      const onEnd = () => {
        setResizingColumn(null)
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onEnd)
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', onEnd)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onEnd)
      document.addEventListener('touchmove', onMove)
      document.addEventListener('touchend', onEnd)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    },
    [getColumnWidth, getMinWidth],
  )

  const getResizeHandler = React.useCallback(
    (columnId: ExpenseTableColumnId) =>
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const clientX =
          'touches' in e ? e.touches[0]?.clientX : e.clientX
        if (clientX == null) return
        startResize(columnId, clientX)
      },
    [startResize],
  )

  return {
    columnWidths,
    getColumnWidth,
    columnSizeVars,
    resizingColumn,
    getResizeHandler,
    getMinWidth,
  }
}
