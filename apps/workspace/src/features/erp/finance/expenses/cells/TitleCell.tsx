// @ts-nocheck

import * as React from 'react'
import { IconReceipt } from '@tabler/icons-react'

import { Input } from '@/components/ui/input'

import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

type TitleCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

export function TitleCell({ row, companyId, readOnly }: TitleCellProps) {
  const update = useExpenseUpdate(companyId)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(row.title)

  React.useEffect(() => {
    setDraft(row.title)
  }, [row.title])

  const commit = () => {
    setEditing(false)
    const next = draft.trim()
    if (next === row.title) return
    update.mutate({ id: row.id, patch: { title: next } })
  }

  const titleContent =
    readOnly || !editing ? (
      readOnly ? (
        <span className="truncate text-sm font-medium leading-tight">
          {row.title || '—'}
        </span>
      ) : (
        <button
          type="button"
          className="truncate text-left text-sm font-medium leading-tight hover:underline"
          onClick={() => setEditing(true)}
        >
          {row.title || 'Untitled'}
        </button>
      )
    ) : (
      <Input
        className="h-7 text-sm"
        value={draft}
        autoFocus
        disabled={update.isPending}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(row.title)
            setEditing(false)
          }
        }}
      />
    )

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
        <IconReceipt className="size-4" />
      </div>
      <div className="min-w-0">
        {titleContent}
        {row.expenseCategory ? (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {row.expenseCategory}
          </div>
        ) : null}
      </div>
    </div>
  )
}
