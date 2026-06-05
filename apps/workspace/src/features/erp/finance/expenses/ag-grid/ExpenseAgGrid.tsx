// @ts-nocheck

import * as React from 'react'
import {
  AllCommunityModule,
  ModuleRegistry,
  type GridApi,
  type FirstDataRenderedEvent,
  type GridReadyEvent,
  type SelectionChangedEvent,
  type SortChangedEvent,
} from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'

import 'ag-grid-community/styles/ag-grid.css'
import './expense-ag-grid-theme.css'

import { DocumentUploadDialog } from '../documents/DocumentUploadDialog'
import {
  EXPENSE_ACTIONS_COLUMN_WIDTH,
  EXPENSE_CHECKBOX_COLUMN_WIDTH,
  EXPENSE_COLUMN_DEFS,
  expenseTableMinWidth,
} from '../config/column-defs'
import {
  sortColumnForTableColumn,
  type ExpenseSortColumn,
} from '../data/field-map'
import type {
  ExpenseAdminTableProps,
  ExpenseRow,
  ExpenseTableColumnId,
} from '../ExpenseAdminTable.types'

import { buildExpenseColumnDefs } from './expense-column-defs-ag'
import type { ExpenseAgGridContext } from './expense-cell-renderers'

ModuleRegistry.registerModules([AllCommunityModule])

/** Fixed row height — matches legacy `h-12` cells. */
export const EXPENSE_ROW_HEIGHT = 48

function tableColumnForSortColumn(
  columns: ExpenseTableColumnId[],
  sortColumn: ExpenseSortColumn,
): ExpenseTableColumnId | undefined {
  for (const columnId of columns) {
    if (sortColumnForTableColumn(columnId) === sortColumn) return columnId
  }
  return undefined
}

export function ExpenseAgGrid({
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
  const bulkEnabled = config.bulkActionsEnabled !== false && !readOnly

  const [internalSelectedIds, setInternalSelectedIds] = React.useState<
    Set<string>
  >(new Set())
  const selectedIds = selectedIdsProp ?? internalSelectedIds
  const setSelectedIds = onSelectionChange ?? setInternalSelectedIds

  const gridRef = React.useRef<AgGridReact<ExpenseRow>>(null)
  const apiRef = React.useRef<GridApi<ExpenseRow> | null>(null)
  const syncingSelectionRef = React.useRef(false)
  const syncingSortRef = React.useRef(false)

  const columnDefs = React.useMemo(
    () => buildExpenseColumnDefs({ config, bulkEnabled, readOnly }),
    [config, bulkEnabled, readOnly],
  )

  const tableMinWidth = React.useMemo(
    () => expenseTableMinWidth(config.columns, undefined, { bulkEnabled }),
    [config.columns, bulkEnabled],
  )

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

  const gridContext = React.useMemo<ExpenseAgGridContext>(
    () => ({
      companyId,
      config,
      statuses,
      readOnly,
      uploadEnabled,
      signedUrlsByDocId,
      creditCardsById,
      onDropFile: handleDropFile,
    }),
    [
      companyId,
      config,
      statuses,
      readOnly,
      uploadEnabled,
      signedUrlsByDocId,
      creditCardsById,
      handleDropFile,
    ],
  )

  const applySortState = React.useCallback(() => {
    const api = apiRef.current
    if (!api) return

    const colId = tableColumnForSortColumn(config.columns, sortColumn)
    syncingSortRef.current = true
    api.applyColumnState({
      state: colId ? [{ colId, sort: sortDirection }] : [],
      defaultState: { sort: null },
    })
    syncingSortRef.current = false
  }, [config.columns, sortColumn, sortDirection])

  const applySelectionState = React.useCallback(() => {
    const api = apiRef.current
    if (!api || !bulkEnabled) return

    syncingSelectionRef.current = true
    api.forEachNode((node) => {
      const id = node.data?.id
      if (!id) return
      node.setSelected(selectedIds.has(id), false, true)
    })
    syncingSelectionRef.current = false
  }, [bulkEnabled, selectedIds])

  const applyColumnWidths = React.useCallback((api: GridApi<ExpenseRow>) => {
    api.applyColumnState({
      state: config.columns.map((columnId) => ({
        colId: columnId,
        width: EXPENSE_COLUMN_DEFS[columnId]?.width ?? 100,
        flex: null,
      })),
      applyOrder: false,
    })
    if (bulkEnabled) {
      api.applyColumnState({
        state: [
          {
            colId: '__select__',
            width: EXPENSE_CHECKBOX_COLUMN_WIDTH,
            flex: null,
          },
        ],
      })
    }
    api.applyColumnState({
      state: [
        {
          colId: '__actions__',
          width: EXPENSE_ACTIONS_COLUMN_WIDTH,
          flex: null,
        },
      ],
    })
  }, [bulkEnabled, config.columns])

  const handleGridReady = React.useCallback(
    (event: GridReadyEvent<ExpenseRow>) => {
      apiRef.current = event.api
      applyColumnWidths(event.api)
      applySortState()
      applySelectionState()
    },
    [applyColumnWidths, applySortState, applySelectionState],
  )

  const handleFirstDataRendered = React.useCallback(
    (event: FirstDataRenderedEvent<ExpenseRow>) => {
      applyColumnWidths(event.api)
    },
    [applyColumnWidths],
  )

  React.useEffect(() => {
    applySortState()
  }, [applySortState])

  React.useEffect(() => {
    applySelectionState()
  }, [applySelectionState, rows])

  const handleSortChanged = React.useCallback(
    (event: SortChangedEvent<ExpenseRow>) => {
      if (syncingSortRef.current) return

      const sorted = event.api
        .getColumnState()
        .find((col) => col.sort != null && col.colId !== '__select__')

      if (!sorted?.colId || !sorted.sort) return

      const resolved = sortColumnForTableColumn(sorted.colId)
      if (!resolved) return

      const nextDir = sorted.sort === 'asc' ? 'asc' : 'desc'
      if (resolved === sortColumn && nextDir === sortDirection) return

      onSortChange(resolved, nextDir)
    },
    [onSortChange, sortColumn, sortDirection],
  )

  const handleSelectionChanged = React.useCallback(
    (event: SelectionChangedEvent<ExpenseRow>) => {
      if (syncingSelectionRef.current || !bulkEnabled) return

      const pageIds = new Set(rows.map((row) => row.id))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        event.api.forEachNode((node) => {
          const id = node.data?.id
          if (!id || !pageIds.has(id)) return
          if (node.isSelected()) next.add(id)
          else next.delete(id)
        })
        return next
      })
    },
    [bulkEnabled, rows, setSelectedIds],
  )

  const getRowClass = React.useCallback(
    (params: { node: { isSelected: () => boolean } }) =>
      bulkEnabled && params.node.isSelected() ? 'expense-ag-row-selected' : undefined,
    [bulkEnabled],
  )

  return (
    <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div
          className="expense-ag-grid ag-theme-expense-shadcn h-full w-full text-sm"
          style={{ height: '100%', minWidth: tableMinWidth }}
        >
          <AgGridReact<ExpenseRow>
            ref={gridRef}
            theme="legacy"
            rowData={rows}
            columnDefs={columnDefs}
            context={gridContext}
            getRowId={(params) => params.data.id}
            rowHeight={EXPENSE_ROW_HEIGHT}
            headerHeight={EXPENSE_ROW_HEIGHT}
            domLayout="normal"
            suppressCellFocus
            suppressRowHoverHighlight={false}
            animateRows={false}
            enableCellTextSelection
            getRowClass={getRowClass}
            popupParent={
              typeof document !== 'undefined' ? document.body : undefined
            }
            rowSelection={
              bulkEnabled
                ? {
                    mode: 'multiRow',
                    checkboxes: false,
                    headerCheckbox: false,
                    enableClickSelection: false,
                  }
                : undefined
            }
            onGridReady={handleGridReady}
            onFirstDataRendered={handleFirstDataRendered}
            onSortChanged={handleSortChanged}
            onSelectionChanged={handleSelectionChanged}
          />
        </div>
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
