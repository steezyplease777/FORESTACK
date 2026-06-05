// @ts-nocheck

import { Badge } from '@/components/reui/badge'

import type { ExpenseRow } from '../ExpenseAdminTable.types'

type TagsCellProps = {
  row: ExpenseRow
}

export function TagsCell({ row }: TagsCellProps) {
  if (row.invoiceTags.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const visible = row.invoiceTags.slice(0, 3)
  const overflow = row.invoiceTags.length - visible.length

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <Badge key={tag.id} variant="outline" size="xs" className="max-w-full truncate">
          {tag.label || tag.id.slice(0, 8)}
        </Badge>
      ))}
      {overflow > 0 ? (
        <span className="text-[10px] text-muted-foreground">+{overflow}</span>
      ) : null}
    </div>
  )
}
