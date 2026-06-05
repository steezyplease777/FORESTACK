// @ts-nocheck

import * as React from 'react'
import { IconSelector } from '@tabler/icons-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow, StatusColorConfig } from '../ExpenseAdminTable.types'

type StatusCellProps = {
  row: ExpenseRow
  companyId: string
  statuses: ExpenseStatus[]
  statusColors?: StatusColorConfig[]
  readOnly?: boolean
}

function resolveStatusStyle(
  label: string,
  dbColor: string | null,
  statusColors: StatusColorConfig[] = [],
): React.CSSProperties | undefined {
  const fromConfig = statusColors.find(
    (c) => c.statusName.toUpperCase() === label.toUpperCase(),
  )
  if (fromConfig) {
    return {
      color: fromConfig.textColor,
      backgroundColor: fromConfig.backgroundColor,
    }
  }
  if (dbColor) {
    return { color: dbColor, backgroundColor: `${dbColor}22` }
  }
  return undefined
}

function ExpenseStatusBadge({
  label,
  style,
  interactive,
}: {
  label: string
  style?: React.CSSProperties
  interactive?: boolean
}) {
  if (!label || label === '—') {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 truncate rounded px-2 py-1',
        'text-[11px] font-semibold leading-tight',
        !style && 'bg-muted text-muted-foreground',
      )}
      style={style}
    >
      <span className="truncate">{label}</span>
      {interactive ? (
        <IconSelector className="size-3 shrink-0 opacity-60" />
      ) : null}
    </span>
  )
}

export function StatusCell({
  row,
  companyId,
  statuses,
  statusColors,
  readOnly,
}: StatusCellProps) {
  const update = useExpenseUpdate(companyId)
  const badgeStyle = resolveStatusStyle(
    row.status,
    row.statusColor,
    statusColors,
  )

  if (readOnly || statuses.length === 0) {
    return (
      <ExpenseStatusBadge label={row.status || '—'} style={badgeStyle} />
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={update.isPending}>
        <button
          type="button"
          className="max-w-full rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExpenseStatusBadge
            label={row.status || 'Set status'}
            style={badgeStyle}
            interactive
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
            <ExpenseStatusBadge
              label={status.name}
              style={resolveStatusStyle(status.name, status.color, statusColors)}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
