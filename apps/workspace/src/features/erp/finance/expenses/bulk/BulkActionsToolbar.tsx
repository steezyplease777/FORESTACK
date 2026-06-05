// @ts-nocheck

import * as React from 'react'
import {
  IconDots,
  IconDownload,
  IconLoader2,
  IconTrash,
} from '@tabler/icons-react'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

import type { ExpenseBulkActionConfig } from '../ExpenseAdminTable.types'

type BulkActionId = 'selectAllMatching' | 'export' | 'delete'

/** Lowest-priority actions overflow first (leftmost in this list hides first). */
const OVERFLOW_PRIORITY: BulkActionId[] = [
  'selectAllMatching',
  'export',
  'delete',
]

const TOOLBAR_GAP_PX = 8
const TOOLBAR_PADDING_PX = 32
const OVERFLOW_TRIGGER_WIDTH_PX = 36

type BulkActionsToolbarProps = {
  selectedCount: number
  selectedIds: string[]
  totalMatchingCount?: number
  bulkActions: ExpenseBulkActionConfig[]
  isLoading?: boolean
  onClear: () => void
  onSelectAllMatching?: () => void
  onExport: () => void
  onDelete: () => void
}

const toolbarButtonClass =
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55'

function buttonVariantClass(style?: ExpenseBulkActionConfig['style']) {
  if (style === 'primary') {
    return 'border-white bg-white text-slate-900 hover:bg-white/90'
  }
  if (style === 'destructive') {
    return 'border-red-400/35 bg-red-400/10 text-red-200 hover:bg-red-400/20'
  }
  return 'border-white/15 bg-white/8 text-slate-50 hover:bg-white/12'
}

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  totalMatchingCount,
  bulkActions,
  isLoading,
  onClear,
  onSelectAllMatching,
  onExport,
  onDelete,
}: BulkActionsToolbarProps) {
  const [pendingDelete, setPendingDelete] = React.useState(false)
  const [overflowing, setOverflowing] = React.useState<Set<BulkActionId>>(
    () => new Set(),
  )

  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const stableRef = React.useRef<HTMLDivElement>(null)
  const measureRef = React.useRef<HTMLDivElement>(null)
  const measureButtonRefs = React.useRef<
    Partial<Record<BulkActionId, HTMLButtonElement | null>>
  >({})

  const safeActions = bulkActions.filter(
    (a) => a && typeof a === 'object' && a.actionType !== 'changeStatus',
  )

  const exportAction = safeActions.find((a) => a.actionType === 'export')
  const deleteAction = safeActions.find((a) => a.actionType === 'delete')

  const showSelectAllMatching =
    typeof totalMatchingCount === 'number' &&
    totalMatchingCount > selectedCount &&
    typeof onSelectAllMatching === 'function'

  const availableActions = React.useMemo(() => {
    const ids: BulkActionId[] = []
    if (showSelectAllMatching) ids.push('selectAllMatching')
    if (exportAction) ids.push('export')
    if (deleteAction) ids.push('delete')
    return ids
  }, [showSelectAllMatching, exportAction, deleteAction])

  const getActionWidth = React.useCallback((id: BulkActionId) => {
    return measureButtonRefs.current[id]?.offsetWidth ?? 0
  }, [])

  const computeOverflow = React.useCallback((maxWidth?: number) => {
    const toolbar = toolbarRef.current
    const stable = stableRef.current
    const parent = toolbar?.parentElement
    if (!toolbar || !stable || availableActions.length === 0) {
      setOverflowing(new Set())
      return
    }

    const resolvedMaxWidth =
      maxWidth ?? parent?.clientWidth ?? toolbar.clientWidth
    const stableWidth = stable.offsetWidth
    const available =
      resolvedMaxWidth - stableWidth - TOOLBAR_PADDING_PX - TOOLBAR_GAP_PX

    const nextOverflow = new Set<BulkActionId>()
    const candidates = OVERFLOW_PRIORITY.filter((id) =>
      availableActions.includes(id),
    )

    const visibleWidth = (hidden: Set<BulkActionId>) => {
      let width = 0
      let count = 0
      for (const id of availableActions) {
        if (hidden.has(id)) continue
        const actionWidth = getActionWidth(id)
        if (actionWidth <= 0) continue
        width += actionWidth + (count > 0 ? TOOLBAR_GAP_PX : 0)
        count += 1
      }
      if (hidden.size > 0) {
        width += TOOLBAR_GAP_PX + OVERFLOW_TRIGGER_WIDTH_PX
      }
      return width
    }

    for (const id of candidates) {
      if (visibleWidth(nextOverflow) <= available) break
      nextOverflow.add(id)
    }

    setOverflowing(nextOverflow)
  }, [availableActions, getActionWidth])

  React.useLayoutEffect(() => {
    const toolbar = toolbarRef.current
    const parent = toolbar?.parentElement
    if (!toolbar || !parent) return

    const run = () => {
      requestAnimationFrame(() => {
        computeOverflow(parent.clientWidth)
      })
    }

    run()

    const ro = new ResizeObserver(() => {
      run()
    })
    ro.observe(parent)

    return () => ro.disconnect()
  }, [computeOverflow, selectedCount, totalMatchingCount, safeActions.length])

  if (selectedCount === 0) return null

  const disabled = isLoading

  const triggerDelete = () => {
    if (deleteAction?.requireConfirmation) {
      setPendingDelete(true)
      return
    }
    onDelete()
  }

  const renderActionButton = (
    id: BulkActionId,
    options?: { forMeasure?: boolean },
  ) => {
    if (id === 'selectAllMatching' && showSelectAllMatching) {
      return (
        <button
          key="selectAllMatching"
          ref={(el) => {
            measureButtonRefs.current.selectAllMatching = el
          }}
          type="button"
          onClick={onSelectAllMatching}
          disabled={disabled}
          className={cn(
            toolbarButtonClass,
            'border-background/25 bg-transparent text-background hover:bg-background/10',
          )}
        >
          Select All Matching ({totalMatchingCount.toLocaleString()})
        </button>
      )
    }

    if (id === 'export' && exportAction) {
      return (
        <button
          key="export"
          ref={(el) => {
            measureButtonRefs.current.export = el
          }}
          type="button"
          disabled={disabled}
          onClick={options?.forMeasure ? undefined : onExport}
          className={cn(
            toolbarButtonClass,
            buttonVariantClass(exportAction.style),
          )}
        >
          <IconDownload className="size-3.5" />
          <span>{exportAction.label}</span>
        </button>
      )
    }

    if (id === 'delete' && deleteAction) {
      return (
        <button
          key="delete"
          ref={(el) => {
            measureButtonRefs.current.delete = el
          }}
          type="button"
          disabled={disabled}
          onClick={options?.forMeasure ? undefined : triggerDelete}
          className={cn(
            toolbarButtonClass,
            buttonVariantClass(deleteAction.style),
          )}
        >
          <IconTrash className="size-3.5" />
          <span>{deleteAction.label}</span>
        </button>
      )
    }

    return null
  }

  const renderOverflowMenuItem = (id: BulkActionId) => {
    if (id === 'selectAllMatching' && showSelectAllMatching) {
      return (
        <DropdownMenuItem
          key="selectAllMatching"
          disabled={disabled}
          onClick={onSelectAllMatching}
        >
          Select All Matching ({totalMatchingCount.toLocaleString()})
        </DropdownMenuItem>
      )
    }

    if (id === 'export' && exportAction) {
      return (
        <DropdownMenuItem key="export" disabled={disabled} onClick={onExport}>
          <IconDownload className="size-3.5" />
          {exportAction.label}
        </DropdownMenuItem>
      )
    }

    if (id === 'delete' && deleteAction) {
      return (
        <DropdownMenuItem
          key="delete"
          disabled={disabled}
          variant="destructive"
          onClick={triggerDelete}
        >
          <IconTrash className="size-3.5" />
          {deleteAction.label}
        </DropdownMenuItem>
      )
    }

    return null
  }

  const inlineActions = availableActions.filter((id) => !overflowing.has(id))
  const overflowActions = availableActions.filter((id) => overflowing.has(id))

  return (
    <>
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Bulk actions"
        className="bulk-actions-toolbar relative inline-flex w-full max-w-full flex-nowrap items-center gap-2 whitespace-nowrap rounded-2xl border border-white/10 bg-foreground px-4 py-2.5 text-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
      >
        <div
          ref={stableRef}
          className="flex shrink-0 flex-nowrap items-center gap-2 whitespace-nowrap"
        >
          <span className="text-xs font-semibold tabular-nums">
            {selectedCount} selected
          </span>

          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-background/85 transition-colors hover:bg-background/10 disabled:opacity-55"
          >
            Clear
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-2">
          {inlineActions.map((id) => renderActionButton(id))}

          {overflowActions.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                  type="button"
                  aria-label="More bulk actions"
                  className={cn(
                    toolbarButtonClass,
                    'border-white/15 bg-white/8 px-2 text-slate-50 hover:bg-white/12',
                  )}
                >
                  {isLoading ? (
                    <IconLoader2 className="size-3.5 animate-spin" />
                  ) : (
                    <IconDots className="size-4" stroke={2} />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem]">
                {overflowActions.map((id) => renderOverflowMenuItem(id))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute -left-[9999px] top-0 flex flex-nowrap items-center gap-2"
        >
          {availableActions.map((id) =>
            renderActionButton(id, { forMeasure: true }),
          )}
        </div>
      </div>

      {deleteAction?.requireConfirmation ? (
        <ConfirmDialog
          open={pendingDelete}
          onOpenChange={setPendingDelete}
          title={deleteAction.confirmationTitle ?? 'Delete expenses?'}
          description={
            deleteAction.confirmationMessage ??
            `Delete ${selectedIds.length} selected expense(s)? This cannot be undone.`
          }
          confirmText={deleteAction.confirmButtonLabel ?? 'Delete'}
          tone="destructive"
          onCancel={() => setPendingDelete(false)}
          onConfirm={() => {
            setPendingDelete(false)
            onDelete()
          }}
        />
      ) : null}
    </>
  )
}
