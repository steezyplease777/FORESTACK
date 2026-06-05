// @ts-nocheck

import { IconDotsVertical } from '@tabler/icons-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { ExpenseRow } from '../ExpenseAdminTable.types'

type RowActionsCellProps = {
  row: ExpenseRow
}

export function RowActionsCell({ row }: RowActionsCellProps) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted"
            aria-label="Row actions"
          >
            <IconDotsVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Actions
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>View expense</DropdownMenuItem>
          <DropdownMenuItem disabled>Edit expense</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
