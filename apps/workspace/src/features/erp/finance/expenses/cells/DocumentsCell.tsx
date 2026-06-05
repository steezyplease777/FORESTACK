// @ts-nocheck

import { IconFile } from '@tabler/icons-react'

import type { ExpenseRow } from '../ExpenseAdminTable.types'

type DocumentsCellProps = {
  row: ExpenseRow
}

export function DocumentsCell({ row }: DocumentsCellProps) {
  if (row.documents.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const visible = row.documents.slice(0, 4)
  const overflow = row.documents.length - visible.length

  return (
    <div className="flex min-w-0 items-center gap-1">
      {visible.map((doc) => (
        <span
          key={doc.id}
          title={doc.name}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded border bg-muted/40 text-muted-foreground"
        >
          <IconFile className="size-3.5" />
        </span>
      ))}
      {overflow > 0 ? (
        <span className="text-[10px] text-muted-foreground">+{overflow}</span>
      ) : null}
    </div>
  )
}
