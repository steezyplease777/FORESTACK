// @ts-nocheck

import * as React from 'react'

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

  if (readOnly) {
    return <span className="font-medium">{row.title || '—'}</span>
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="max-w-[280px] truncate text-left font-medium hover:underline"
        onClick={() => setEditing(true)}
      >
        {row.title || 'Untitled'}
      </button>
    )
  }

  return (
    <Input
      className="h-8"
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
}
