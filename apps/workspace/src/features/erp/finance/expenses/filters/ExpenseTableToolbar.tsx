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
import {
  useExpenseCategories,
  useExpenseDepartmentOptions,
  useExpenseProjectOptions,
  useExpenseTags,
} from '../data/use-expenses-query'
import { ExpenseFilterChips } from './ExpenseFilterChips'
import { ExpenseStructuredFilters } from './ExpenseStructuredFilters'
import type { FilterOption } from './filter-bodies'

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
  const categoriesQuery = useExpenseCategories(companyId)
  const projectsQuery = useExpenseProjectOptions(companyId)
  const departmentsQuery = useExpenseDepartmentOptions(companyId)
  const tagsQuery = useExpenseTags(companyId)

  const categoryOptions: FilterOption[] = (categoriesQuery.data ?? []).map(
    (c) => ({ id: c.id, label: c.name }),
  )
  const projectOptions: FilterOption[] = (projectsQuery.data ?? []).map(
    (p) => ({ id: p.id, label: p.name }),
  )
  const departmentOptions: FilterOption[] = (
    departmentsQuery.data ?? []
  ).map((d) => ({ id: d, label: d }))
  const tagOptions: FilterOption[] = (tagsQuery.data ?? []).map((t) => ({
    id: t.id,
    label: t.name,
  }))

  return (
    <div className="shrink-0 bg-background font-sans font-normal">
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="relative min-w-0 flex-1">
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search invoices…"
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
            <Button
              variant="outline"
              size="sm"
              className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
            >
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
            <DropdownMenuCheckboxItem disabled>
              Department
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ExpenseFilterChips
        filters={filters}
        statuses={statuses}
        departmentOptions={departmentOptions}
        categoryOptions={categoryOptions}
        projectOptions={projectOptions}
        tagOptions={tagOptions}
        onChange={onFiltersChange}
        onClearAll={onClearStructuredFilters}
      />
    </div>
  )
}
