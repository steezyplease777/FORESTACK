// @ts-nocheck

import { IconSearch } from '@tabler/icons-react'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import type { ActiveFilters } from '../ExpenseAdminTable.types'

type ExpenseTableToolbarProps = {
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  onSearchChange: (q: string) => void
  onStatusChange: (statusId: string | undefined) => void
}

export function ExpenseTableToolbar({
  filters,
  statuses,
  onSearchChange,
  onStatusChange,
}: ExpenseTableToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 w-56 pl-8"
          placeholder="Search title…"
          value={filters.q}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <Select
        value={filters.statusId ?? '__all__'}
        onValueChange={(v) => onStatusChange(v === '__all__' ? undefined : v)}
      >
        <SelectTrigger className="h-8 w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
