// @ts-nocheck

import * as React from 'react'
import {
  IconCalendar,
  IconCircleDot,
  IconFilter,
  IconHash,
  IconTag,
  IconUsers,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { countStructuredFilters } from '../data/query-builder'
import {
  useExpenseCategories,
  useExpenseDepartmentOptions,
  useExpenseProjectOptions,
  useExpenseTags,
} from '../data/use-expenses-query'
import type { ActiveFilters } from '../ExpenseAdminTable.types'
import {
  DateRangeFilterBody,
  MultiSelectFilterBody,
  NumberRangeFilterBody,
  type FilterOption,
} from './filter-bodies'

type ExpenseStructuredFiltersProps = {
  companyId: string
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  onChange: (next: ActiveFilters) => void
  onClear: () => void
}

function FilterSection({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-normal text-foreground">
        <Icon className="size-3.5 opacity-70" />
        {title}
      </div>
      <div className="rounded-md border bg-background">{children}</div>
    </section>
  )
}

export function ExpenseStructuredFilters({
  companyId,
  filters,
  statuses,
  onChange,
  onClear,
}: ExpenseStructuredFiltersProps) {
  const [open, setOpen] = React.useState(false)

  const categoriesQuery = useExpenseCategories(companyId)
  const projectsQuery = useExpenseProjectOptions(companyId)
  const departmentsQuery = useExpenseDepartmentOptions(companyId)
  const tagsQuery = useExpenseTags(companyId)

  const statusOptions: FilterOption[] = statuses.map((s) => ({
    id: s.id,
    label: s.name,
  }))
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

  const structuredCount = countStructuredFilters(filters)

  const patch = (partial: Partial<ActiveFilters>) =>
    onChange({ ...filters, ...partial })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2.5 text-xs"
        >
          <IconFilter className="size-3.5" />
          Filter
          {structuredCount > 0 ? (
            <span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-indigo-50 px-1 text-[10px] font-normal text-indigo-800">
              {structuredCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="shrink-0 border-b px-4 py-4 text-left">
          <div className="flex items-center justify-between gap-2">
            <div>
              <SheetTitle className="text-base">Filters</SheetTitle>
              <SheetDescription className="text-xs">
                Narrow by status, department, amount, and more.
              </SheetDescription>
            </div>
            {structuredCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 text-xs"
                onClick={onClear}
              >
                Clear all
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <FilterSection title="Status" icon={IconCircleDot}>
            <MultiSelectFilterBody
              label="Status"
              options={statusOptions}
              selectedIds={filters.statusIds}
              onChange={(statusIds) => patch({ statusIds })}
            />
          </FilterSection>

          <FilterSection title="Department" icon={IconUsers}>
            <MultiSelectFilterBody
              label="Department"
              options={departmentOptions}
              selectedIds={filters.departmentValues}
              onChange={(departmentValues) => patch({ departmentValues })}
            />
          </FilterSection>

          <FilterSection title="Category" icon={IconTag}>
            <MultiSelectFilterBody
              label="Category"
              options={categoryOptions}
              selectedIds={filters.categoryIds}
              onChange={(categoryIds) => patch({ categoryIds })}
            />
          </FilterSection>

          <FilterSection title="Project" icon={IconTag}>
            <MultiSelectFilterBody
              label="Project"
              options={projectOptions}
              selectedIds={filters.projectIds}
              onChange={(projectIds) => patch({ projectIds })}
            />
          </FilterSection>

          <FilterSection title="Tags" icon={IconTag}>
            <MultiSelectFilterBody
              label="Tags"
              options={tagOptions}
              selectedIds={filters.tagIds}
              onChange={(tagIds) => patch({ tagIds })}
            />
          </FilterSection>

          <FilterSection title="Amount" icon={IconHash}>
            <div className="p-3">
              <NumberRangeFilterBody
                min={filters.amountMin}
                max={filters.amountMax}
                onChange={(amountMin, amountMax) =>
                  patch({ amountMin, amountMax })
                }
              />
            </div>
          </FilterSection>

          <FilterSection title="Submitted date" icon={IconCalendar}>
            <div className="p-3">
              <DateRangeFilterBody
                from={filters.dateFrom}
                to={filters.dateTo}
                onChange={(dateFrom, dateTo) => patch({ dateFrom, dateTo })}
              />
            </div>
          </FilterSection>
        </div>
      </SheetContent>
    </Sheet>
  )
}
