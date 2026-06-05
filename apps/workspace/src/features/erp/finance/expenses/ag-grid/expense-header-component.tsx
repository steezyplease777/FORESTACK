// @ts-nocheck

import * as React from 'react'
import type { IHeaderParams } from 'ag-grid-community'
import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'

import { cn } from '@/lib/utils'

import { EXPENSE_COLUMN_DEFS } from '../config/column-defs'
import type { ExpenseTableColumnId } from '../ExpenseAdminTable.types'

/** Spreadsheet header — icon + label + sort chevron (legacy SortableHeader). */
export function ExpenseColumnHeader(params: IHeaderParams) {
  const [, setTick] = React.useState(0)

  React.useEffect(() => {
    const onSortChanged = () => setTick((t) => t + 1)
    params.api.addEventListener('sortChanged', onSortChanged)
    return () => {
      if (!params.api.isDestroyed?.()) {
        params.api.removeEventListener('sortChanged', onSortChanged)
      }
    }
  }, [params.api])

  const colId = params.column.getColId() as ExpenseTableColumnId
  const def = EXPENSE_COLUMN_DEFS[colId]
  const label = def?.label ?? params.displayName
  const Icon = def?.icon
  const alignRight = def?.align === 'right'
  const sort = params.column.getSort()
  const sortable = params.enableSorting

  const onClick = (event: React.MouseEvent) => {
    if (!sortable) return
    params.progressSort(event.shiftKey)
  }

  const content = (
    <>
      {Icon ? <Icon className="size-3 shrink-0 opacity-80" /> : null}
      <span className="truncate">{label}</span>
      {sortable ? (
        <span className={cn('shrink-0', sort ? 'opacity-100' : 'opacity-30')}>
          {sort === 'asc' ? (
            <IconArrowUp className="size-3" />
          ) : (
            <IconArrowDown className="size-3" />
          )}
        </span>
      ) : null}
    </>
  )

  if (!sortable) {
    return (
      <div
        className={cn(
          'flex min-w-0 w-full items-center gap-1.5 text-xs font-medium',
          alignRight && 'justify-end',
        )}
      >
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={cn(
        'flex min-w-0 w-full items-center gap-1.5 text-left text-xs font-medium',
        alignRight && 'justify-end',
      )}
      onClick={onClick}
    >
      {content}
    </button>
  )
}
