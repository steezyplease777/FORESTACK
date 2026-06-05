// @ts-nocheck

import { Badge } from '@/components/reui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

type StatusCellProps = {
  row: ExpenseRow
  companyId: string
  statuses: ExpenseStatus[]
  readOnly?: boolean
}

function ExpenseStatusBadge({
  label,
  color,
}: {
  label: string
  color: string | null
}) {
  return (
    <Badge
      variant="outline"
      size="sm"
      style={
        color ? { borderColor: color, color } : undefined
      }
    >
      {label}
    </Badge>
  )
}

export function StatusCell({
  row,
  companyId,
  statuses,
  readOnly,
}: StatusCellProps) {
  const update = useExpenseUpdate(companyId)

  if (readOnly || statuses.length === 0) {
    return (
      <ExpenseStatusBadge
        label={row.status || '—'}
        color={row.statusColor}
      />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={update.isPending}>
        <button
          type="button"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExpenseStatusBadge
            label={row.status || 'Set status'}
            color={row.statusColor}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {statuses.map((status) => (
          <DropdownMenuItem
            key={status.id}
            onClick={() => {
              if (status.id === row.statusId) return
              update.mutate({ id: row.id, patch: { status_id: status.id } })
            }}
          >
            <ExpenseStatusBadge label={status.name} color={status.color} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
