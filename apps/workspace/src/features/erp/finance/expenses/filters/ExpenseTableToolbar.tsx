// @ts-nocheck

import * as React from 'react'
import { IconFolder, IconSearch, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import type { ActiveFilters } from '../ExpenseAdminTable.types'
import { ExpenseStructuredFilters } from './ExpenseStructuredFilters'

type ExpenseTableToolbarProps = {
  companyId: string
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  searchValue: string
  onSearchChange: (value: string) => void
  onFiltersChange: (filters: ActiveFilters) => void
  onClearStructuredFilters: () => void
}

export function ExpenseTableToolbar({
  companyId,
  filters,
  statuses,
  searchValue,
  onSearchChange,
  onFiltersChange,
  onClearStructuredFilters,
}: ExpenseTableToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b bg-background px-3 py-2">
      <div className="relative min-w-0 flex-1">
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search expenses…"
          className="h-8 border-0 bg-muted/50 pl-8 pr-8 shadow-none"
        />
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground" />
        {searchValue ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <IconX className="size-3" />
          </button>
        ) : null}
      </div>

      <ExpenseStructuredFilters
        companyId={companyId}
        filters={filters}
        statuses={statuses}
        onChange={onFiltersChange}
        onClear={onClearStructuredFilters}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 px-2.5 text-xs">
            <IconFolder className="size-3.5 opacity-70" />
            Group
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
            Group rows by
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked disabled>
            None
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem disabled>Status</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem disabled>Category</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem disabled>Department</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
