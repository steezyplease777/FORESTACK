// @ts-nocheck

import { formatExpenseDate } from '../data/to-row'

type DateCellProps = {
  value: string
}

export function DateCell({ value }: DateCellProps) {
  return (
    <span className="text-xs text-muted-foreground tabular-nums">
      {formatExpenseDate(value)}
    </span>
  )
}
