// @ts-nocheck

import * as React from 'react'
import {
  IconCalendar,
  IconCircleDot,
  IconFilter,
  IconHash,
  IconTag,
  IconUsers,
  IconX,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { countStructuredFilters } from '../data/query-builder'
import {
  useExpenseCategories,
  useExpenseDepartmentOptions,
  useExpenseProjectOptions,
  useExpenseTags,
} from '../data/use-expenses-query'
import type { ActiveFilters } from '../ExpenseAdminTable.types'

type ExpenseStructuredFiltersProps = {
  companyId: string
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  onChange: (next: ActiveFilters) => void
  onClear: () => void
}

type Option = { id: string; label: string }

function MultiSelectBody({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string
  options: Option[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    )
  }

  return (
    <div className="w-56 p-2">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="max-h-48 space-y-2 overflow-auto">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground">No options</p>
        ) : (
          options.map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={selectedIds.includes(opt.id)}
                onCheckedChange={() => toggle(opt.id)}
              />
              <span className="truncate">{opt.label}</span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

function summary(
  base: string,
  selectedIds: string[],
  options: Option[],
): string {
  if (selectedIds.length === 0) return base
  if (selectedIds.length === 1) {
    const hit = options.find((o) => o.id === selectedIds[0])
    return `${base} · ${hit?.label ?? '1'}`
  }
  return `${base} · ${selectedIds.length}`
}

function statusSummary(
  statusId: string | undefined,
  statuses: ExpenseStatus[],
): string {
  if (!statusId) return 'Status'
  const hit = statuses.find((s) => s.id === statusId)
  return hit ? `Status · ${hit.name}` : 'Status'
}

export function ExpenseStructuredFilters({
  companyId,
  filters,
  statuses,
  onChange,
  onClear,
}: ExpenseStructuredFiltersProps) {
  const categoriesQuery = useExpenseCategories(companyId)
  const projectsQuery = useExpenseProjectOptions(companyId)
  const departmentsQuery = useExpenseDepartmentOptions(companyId)
  const tagsQuery = useExpenseTags(companyId)

  const categoryOptions: Option[] = (categoriesQuery.data ?? []).map((c) => ({
    id: c.id,
    label: c.name,
  }))
  const projectOptions: Option[] = (projectsQuery.data ?? []).map((p) => ({
    id: p.id,
    label: p.name,
  }))
  const departmentOptions: Option[] = (departmentsQuery.data ?? []).map(
    (d) => ({ id: d, label: d }),
  )
  const tagOptions: Option[] = (tagsQuery.data ?? []).map((t) => ({
    id: t.id,
    label: t.name,
  }))

  const structuredCount = countStructuredFilters(filters)

  const patch = (partial: Partial<ActiveFilters>) =>
    onChange({ ...filters, ...partial })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
        >
          <IconFilter className="size-3.5" />
          Filter
          {structuredCount > 0 ? (
            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-50 px-1 text-[10px] font-semibold text-indigo-800">
              {structuredCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide">
          Filters
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconCircleDot className="mr-2 size-3.5 opacity-70" />
            {statusSummary(filters.statusId, statuses)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-2">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="max-h-48 space-y-2 overflow-auto">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={!filters.statusId}
                  onCheckedChange={() => patch({ statusId: undefined })}
                />
                <span>All statuses</span>
              </label>
              {statuses.map((status) => (
                <label
                  key={status.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={filters.statusId === status.id}
                    onCheckedChange={() =>
                      patch({
                        statusId:
                          filters.statusId === status.id
                            ? undefined
                            : status.id,
                      })
                    }
                  />
                  <span className="truncate">{status.name}</span>
                </label>
              ))}
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconUsers className="mr-2 size-3.5 opacity-70" />
            {summary('Department', filters.departmentValues, departmentOptions)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <MultiSelectBody
              label="Department"
              options={departmentOptions}
              selectedIds={filters.departmentValues}
              onChange={(departmentValues) => patch({ departmentValues })}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconTag className="mr-2 size-3.5 opacity-70" />
            {summary('Category', filters.categoryIds, categoryOptions)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <MultiSelectBody
              label="Category"
              options={categoryOptions}
              selectedIds={filters.categoryIds}
              onChange={(categoryIds) => patch({ categoryIds })}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconTag className="mr-2 size-3.5 opacity-70" />
            {summary('Project', filters.projectIds, projectOptions)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <MultiSelectBody
              label="Project"
              options={projectOptions}
              selectedIds={filters.projectIds}
              onChange={(projectIds) => patch({ projectIds })}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconTag className="mr-2 size-3.5 opacity-70" />
            {summary('Tags', filters.tagIds, tagOptions)}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <MultiSelectBody
              label="Tags"
              options={tagOptions}
              selectedIds={filters.tagIds}
              onChange={(tagIds) => patch({ tagIds })}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconHash className="mr-2 size-3.5 opacity-70" />
            {filters.amountMin || filters.amountMax ? 'Amount · set' : 'Amount'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-3">
            <div className="space-y-2">
              <div>
                <Label className="text-xs">Min</Label>
                <Input
                  className="mt-1 h-8"
                  inputMode="decimal"
                  placeholder="0"
                  value={filters.amountMin}
                  onChange={(e) => patch({ amountMin: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Max</Label>
                <Input
                  className="mt-1 h-8"
                  inputMode="decimal"
                  placeholder="Any"
                  value={filters.amountMax}
                  onChange={(e) => patch({ amountMax: e.target.value })}
                />
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconCalendar className="mr-2 size-3.5 opacity-70" />
            {filters.dateFrom || filters.dateTo ? 'Date · set' : 'Date'}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 p-3">
            <div className="space-y-2">
              <div>
                <Label className="text-xs">From</Label>
                <Input
                  className="mt-1 h-8"
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={(e) =>
                    patch({ dateFrom: e.target.value || null })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input
                  className="mt-1 h-8"
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={(e) => patch({ dateTo: e.target.value || null })}
                />
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {structuredCount > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onClear}>
              <IconX className="mr-2 size-3.5" />
              Clear filters
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
