// @ts-nocheck

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

type StatusCellProps = {
  row: ExpenseRow
  companyId: string
  statuses: ExpenseStatus[]
  readOnly?: boolean
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
      <Badge
        variant="outline"
        style={
          row.statusColor
            ? { borderColor: row.statusColor, color: row.statusColor }
            : undefined
        }
      >
        {row.status || '—'}
      </Badge>
    )
  }

  return (
    <Select
      value={row.statusId ?? ''}
      onValueChange={(statusId) => {
        if (statusId === row.statusId) return
        update.mutate({ id: row.id, patch: { status_id: statusId } })
      }}
      disabled={update.isPending}
    >
      <SelectTrigger className="h-8 w-[140px] border-none bg-transparent shadow-none">
        <SelectValue placeholder="Status">
          {row.status ? (
            <Badge
              variant="outline"
              style={
                row.statusColor
                  ? { borderColor: row.statusColor, color: row.statusColor }
                  : undefined
              }
            >
              {row.status}
            </Badge>
          ) : (
            'Set status'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
