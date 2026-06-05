// @ts-nocheck

import * as React from 'react'
import { toast } from 'sonner'

import { useBulkExpenseUpdate } from '@/lib/data/erp/expenses/hooks'

import type { ExpenseRowSelection } from '../ExpenseAdminTable.types'

const BULK_TOAST_ID = 'expense-bulk-action'

type UseExpenseBulkActionsOptions = {
  companyId: string
  selectedIds: ExpenseRowSelection
  onSelectionChange: React.Dispatch<React.SetStateAction<ExpenseRowSelection>>
  clearSelectionOnSuccess?: boolean
}

export function useExpenseBulkActions({
  companyId,
  selectedIds,
  onSelectionChange,
  clearSelectionOnSuccess = true,
}: UseExpenseBulkActionsOptions) {
  const bulkUpdate = useBulkExpenseUpdate(companyId)

  const selectedCount = selectedIds.size
  const selectedIdList = React.useMemo(
    () => [...selectedIds],
    [selectedIds],
  )

  const clearSelection = React.useCallback(() => {
    onSelectionChange(new Set())
  }, [onSelectionChange])

  const handleChangeStatus = React.useCallback(
    async (statusId: string) => {
      if (selectedCount === 0) {
        toast.error('No expenses selected')
        return
      }

      toast.loading(`Updating ${selectedCount} expense(s)…`, {
        id: BULK_TOAST_ID,
      })

      try {
        const result = await bulkUpdate.mutateAsync({
          ids: selectedIdList,
          patch: { status_id: statusId },
        })

        toast.dismiss(BULK_TOAST_ID)

        if (result.updatedCount === 0) {
          toast.error('No expenses were updated')
          return
        }

        if (result.updatedCount < result.requestedCount) {
          toast.error(
            `Updated ${result.updatedCount} of ${result.requestedCount} expenses`,
            {
              description:
                'Some selected rows could not be updated. They may have been removed or you may lack permission.',
            },
          )
        } else {
          toast.success(
            `Updated ${result.updatedCount} expense${result.updatedCount === 1 ? '' : 's'}`,
          )
        }

        if (clearSelectionOnSuccess) {
          clearSelection()
        }
      } catch (err) {
        toast.dismiss(BULK_TOAST_ID)
        toast.error('Bulk status update failed', {
          description: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    },
    [
      bulkUpdate,
      clearSelection,
      clearSelectionOnSuccess,
      selectedCount,
      selectedIdList,
    ],
  )

  const handleExport = React.useCallback(() => {
    if (selectedCount === 0) {
      toast.error('No expenses selected')
      return
    }
    toast.info('Export coming soon', {
      description: `${selectedCount} selected expense(s) — CSV export is not wired yet.`,
    })
  }, [selectedCount])

  const handleDelete = React.useCallback(() => {
    if (selectedCount === 0) {
      toast.error('No expenses selected')
      return
    }
    toast.info('Delete coming soon', {
      description: `${selectedCount} selected expense(s) — bulk delete is not wired yet.`,
    })
  }, [selectedCount])

  return {
    selectedCount,
    selectedIdList,
    clearSelection,
    handleChangeStatus,
    handleExport,
    handleDelete,
    isBulkLoading: bulkUpdate.isPending,
  }
}
