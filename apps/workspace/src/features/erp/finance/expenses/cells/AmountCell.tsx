// @ts-nocheck

import * as React from 'react'

import { Input } from '@/components/ui/input'

import { useExpenseUpdate } from '../data/use-expense-update'
import { formatExpenseAmount } from '../data/to-row'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

type AmountCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

export function AmountCell({ row, companyId, readOnly }: AmountCellProps) {
  const update = useExpenseUpdate(companyId)
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(
    row.amount != null ? String(row.amount) : '',
  )

  React.useEffect(() => {
    setDraft(row.amount != null ? String(row.amount) : '')
  }, [row.amount])

  const commit = () => {
    setEditing(false)
    const parsed = draft.trim() === '' ? null : parseFloat(draft)
    if (parsed === row.amount) return
    if (parsed != null && !Number.isFinite(parsed)) return
    update.mutate({ id: row.id, patch: { amount: parsed } })
  }

  if (readOnly) {
    return (
      <span className="tabular-nums">{formatExpenseAmount(row.amount)}</span>
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        className="tabular-nums text-left hover:underline"
        onClick={() => setEditing(true)}
      >
        {formatExpenseAmount(row.amount)}
      </button>
    )
  }

  return (
    <Input
      className="h-8 w-28 tabular-nums"
      value={draft}
      autoFocus
      disabled={update.isPending}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') {
          setDraft(row.amount != null ? String(row.amount) : '')
          setEditing(false)
        }
      }}
    />
  )
}
