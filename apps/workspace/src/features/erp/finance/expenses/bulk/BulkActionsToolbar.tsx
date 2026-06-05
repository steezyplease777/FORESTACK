// @ts-nocheck

import * as React from 'react'
import {
  IconChevronDown,
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
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import type {
  ExpenseBulkActionConfig,
  StatusColorConfig,
} from '../ExpenseAdminTable.types'

type BulkActionsToolbarProps = {
  selectedCount: number
  selectedIds: string[]
  totalMatchingCount?: number
  bulkActions: ExpenseBulkActionConfig[]
  statuses: ExpenseStatus[]
  statusColors?: StatusColorConfig[]
  isLoading?: boolean
  onClear: () => void
  onSelectAllMatching?: () => void
  onChangeStatus: (statusId: string) => void
  onExport: () => void
  onDelete: () => void
}

function resolveStatusStyle(
  label: string,
  dbColor: string | null,
  statusColors: StatusColorConfig[] = [],
): React.CSSProperties | undefined {
  const fromConfig = statusColors.find(
    (c) => c.statusName.toUpperCase() === label.toUpperCase(),
  )
  if (fromConfig) {
    return {
      color: fromConfig.textColor,
      backgroundColor: fromConfig.backgroundColor,
    }
  }
  if (dbColor) {
    return { color: dbColor, backgroundColor: `${dbColor}22` }
  }
  return undefined
}

const toolbarButtonClass =
  'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55'

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  totalMatchingCount,
  bulkActions,
  statuses,
  statusColors,
  isLoading,
  onClear,
  onSelectAllMatching,
  onChangeStatus,
  onExport,
  onDelete,
}: BulkActionsToolbarProps) {
  const [pendingDelete, setPendingDelete] = React.useState(false)

  if (selectedCount === 0) return null

  const safeActions = bulkActions.filter((a) => a && typeof a === 'object')

  const buttonVariantClass = (style?: ExpenseBulkActionConfig['style']) => {
    if (style === 'primary') {
      return 'border-white bg-white text-slate-900 hover:bg-white/90'
    }
    if (style === 'destructive') {
      return 'border-red-400/35 bg-red-400/10 text-red-200 hover:bg-red-400/20'
    }
    return 'border-white/15 bg-white/8 text-slate-50 hover:bg-white/12'
  }

  const renderAction = (action: ExpenseBulkActionConfig, idx: number) => {
    const disabled = isLoading

    if (action.actionType === 'changeStatus') {
      return (
        <DropdownMenu key={`${action.label}-${idx}`}>
          <DropdownMenuTrigger asChild disabled={disabled || statuses.length === 0}>
            <button
              type="button"
              className={cn(toolbarButtonClass, buttonVariantClass(action.style))}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <IconLoader2 className="size-3.5 animate-spin" />
              ) : null}
              <span>{action.label}</span>
              <IconChevronDown className="size-3 opacity-70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[12rem]">
            {statuses.map((status) => (
              <DropdownMenuItem
                key={status.id}
                onClick={() => onChangeStatus(status.id)}
              >
                <span
                  className="inline-flex max-w-full truncate rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={resolveStatusStyle(
                    status.name,
                    status.color,
                    statusColors,
                  )}
                >
                  {status.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    if (action.actionType === 'export') {
      return (
        <button
          key={`${action.label}-${idx}`}
          type="button"
          disabled={disabled}
          onClick={onExport}
          className={cn(toolbarButtonClass, buttonVariantClass(action.style))}
        >
          <IconDownload className="size-3.5" />
          <span>{action.label}</span>
        </button>
      )
    }

    if (action.actionType === 'delete') {
      return (
        <button
          key={`${action.label}-${idx}`}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (action.requireConfirmation) {
              setPendingDelete(true)
              return
            }
            onDelete()
          }}
          className={cn(toolbarButtonClass, buttonVariantClass(action.style))}
        >
          <IconTrash className="size-3.5" />
          <span>{action.label}</span>
        </button>
      )
    }

    return null
  }

  const deleteAction = safeActions.find((a) => a.actionType === 'delete')

  const showSelectAllMatching =
    typeof totalMatchingCount === 'number' &&
    totalMatchingCount > selectedCount &&
    typeof onSelectAllMatching === 'function'

  return (
    <>
      <div
        role="toolbar"
        aria-label="Bulk actions"
        className="bulk-actions-toolbar inline-flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-foreground px-4 py-2.5 text-background shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300"
      >
        <span className="mr-0.5 text-xs font-semibold tabular-nums">
          {selectedCount} selected
        </span>

        <button
          type="button"
          onClick={onClear}
          disabled={isLoading}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-background/85 transition-colors hover:bg-background/10 disabled:opacity-55"
        >
          Clear
        </button>

        {showSelectAllMatching ? (
          <button
            type="button"
            onClick={onSelectAllMatching}
            disabled={isLoading}
            className={cn(
              toolbarButtonClass,
              'border-background/25 bg-transparent text-background hover:bg-background/10',
            )}
          >
            Select All Matching ({totalMatchingCount.toLocaleString()})
          </button>
        ) : null}

        {safeActions.map(renderAction)}
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
