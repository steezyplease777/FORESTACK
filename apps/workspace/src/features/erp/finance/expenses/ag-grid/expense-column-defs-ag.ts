import type { ColDef } from 'ag-grid-community'

import {
  EXPENSE_ACTIONS_COLUMN_WIDTH,
  EXPENSE_CHECKBOX_COLUMN_WIDTH,
  EXPENSE_COLUMN_DEFS,
} from '../config/column-defs'
import { sortColumnForTableColumn } from '../data/field-map'
import type {
  ExpenseTableColumnId,
  ExpenseTableConfig,
} from '../ExpenseAdminTable.types'

import {
  ActionsCellRenderer,
  createExpenseCellRenderer,
} from './expense-cell-renderers'
import { ExpenseColumnHeader } from './expense-header-component'

const HOVER_CARD_COLUMN_IDS = new Set<ExpenseTableColumnId>([
  'attributes',
  'invoiceTags',
])

export type BuildExpenseColumnDefsOptions = {
  config: ExpenseTableConfig
  bulkEnabled: boolean
  readOnly?: boolean
}

export function buildExpenseColumnDefs({
  config,
  bulkEnabled,
}: BuildExpenseColumnDefsOptions): ColDef[] {
  const defs: ColDef[] = []

  if (bulkEnabled) {
    defs.push({
      colId: '__select__',
      headerName: '',
      width: EXPENSE_CHECKBOX_COLUMN_WIDTH,
      minWidth: EXPENSE_CHECKBOX_COLUMN_WIDTH,
      maxWidth: EXPENSE_CHECKBOX_COLUMN_WIDTH,
      flex: 0,
      suppressSizeToFit: true,
      suppressAutoSize: true,
      pinned: 'left',
      lockPinned: true,
      suppressMovable: true,
      sortable: false,
      resizable: false,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: false,
      suppressHeaderMenuButton: true,
      headerClass: 'expense-ag-checkbox-header',
      cellClass: 'expense-ag-checkbox-cell',
    })
  }

  for (const columnId of config.columns) {
    const meta = EXPENSE_COLUMN_DEFS[columnId]
    const sortable = config.sortableColumns.includes(columnId)
    const resolvedSort = sortColumnForTableColumn(columnId)

    defs.push({
      colId: columnId,
      field: columnId,
      headerName: meta?.label ?? columnId,
      width: meta?.width ?? 100,
      minWidth: meta?.width ?? 100,
      flex: 0,
      suppressSizeToFit: true,
      suppressAutoSize: true,
      resizable: true,
      sortable: sortable && !!resolvedSort,
      comparator: () => 0,
      headerComponent: ExpenseColumnHeader,
      suppressHeaderMenuButton: true,
      suppressHeaderFilterButton: true,
      cellRenderer: createExpenseCellRenderer(columnId),
      cellClass:
        meta?.align === 'right'
          ? 'ag-right-aligned-cell'
          : HOVER_CARD_COLUMN_IDS.has(columnId)
            ? 'expense-ag-cell-overflow-visible'
            : undefined,
      headerClass: meta?.align === 'right' ? 'ag-right-aligned-header' : undefined,
    })
  }

  defs.push({
    colId: '__actions__',
    headerName: '',
    width: EXPENSE_ACTIONS_COLUMN_WIDTH,
    minWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
    maxWidth: EXPENSE_ACTIONS_COLUMN_WIDTH,
    flex: 0,
    suppressSizeToFit: true,
    suppressAutoSize: true,
    pinned: 'right',
    lockPinned: true,
    suppressMovable: true,
    sortable: false,
    resizable: false,
    cellRenderer: ActionsCellRenderer,
    suppressHeaderMenuButton: true,
    headerClass: 'expense-ag-actions-header',
    cellClass: 'expense-ag-actions-cell',
  })

  return defs
}
