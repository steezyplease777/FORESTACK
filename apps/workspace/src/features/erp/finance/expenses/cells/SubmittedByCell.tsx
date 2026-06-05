// @ts-nocheck

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import type { ExpenseRow } from '../ExpenseAdminTable.types'

type SubmittedByCellProps = {
  row: ExpenseRow
}

function initialsFromName(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function SubmittedByCell({ row }: SubmittedByCellProps) {
  const name = row.submittedBy?.trim()
  if (!name) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="size-[22px] shrink-0">
        {row.submittedByAvatar ? (
          <AvatarImage src={row.submittedByAvatar} alt="" />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
          {initialsFromName(name)}
        </AvatarFallback>
      </Avatar>
      <span className="truncate text-sm">{name}</span>
    </div>
  )
}
