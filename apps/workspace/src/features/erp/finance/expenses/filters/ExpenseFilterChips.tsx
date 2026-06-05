// @ts-nocheck

import * as React from 'react'
import { IconX } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ExpenseStatus } from '@/lib/data/erp/expenses/types'

import { countStructuredFilters } from '../data/query-builder'
import type { ActiveFilters } from '../ExpenseAdminTable.types'
import type { FilterOption } from './filter-bodies'

type ExpenseFilterChipsProps = {
  filters: ActiveFilters
  statuses: ExpenseStatus[]
  departmentOptions: FilterOption[]
  categoryOptions: FilterOption[]
  projectOptions: FilterOption[]
  tagOptions: FilterOption[]
  onChange: (next: ActiveFilters) => void
  onClearAll: () => void
}

function labelFor(id: string, options: FilterOption[]): string {
  return options.find((o) => o.id === id)?.label ?? id
}

function Chip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1 text-xs font-normal">
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-sm p-0.5 hover:bg-muted"
        aria-label={`Remove ${label} filter`}
      >
        <IconX className="size-3" />
      </button>
    </Badge>
  )
}

export function ExpenseFilterChips({
  filters,
  statuses,
  departmentOptions,
  categoryOptions,
  projectOptions,
  tagOptions,
  onChange,
  onClearAll,
}: ExpenseFilterChipsProps) {
  const count = countStructuredFilters(filters)
  if (count === 0) return null

  const patch = (partial: Partial<ActiveFilters>) =>
    onChange({ ...filters, ...partial })

  const statusOptions: FilterOption[] = statuses.map((s) => ({
    id: s.id,
    label: s.name,
  }))

  const chips: React.ReactNode[] = []

  for (const id of filters.statusIds) {
    chips.push(
      <Chip
        key={`status-${id}`}
        label={`Status · ${labelFor(id, statusOptions)}`}
        onRemove={() =>
          patch({
            statusIds: filters.statusIds.filter((x) => x !== id),
          })
        }
      />,
    )
  }

  for (const id of filters.departmentValues) {
    chips.push(
      <Chip
        key={`dept-${id}`}
        label={`Department · ${labelFor(id, departmentOptions)}`}
        onRemove={() =>
          patch({
            departmentValues: filters.departmentValues.filter((x) => x !== id),
          })
        }
      />,
    )
  }

  for (const id of filters.categoryIds) {
    chips.push(
      <Chip
        key={`cat-${id}`}
        label={`Category · ${labelFor(id, categoryOptions)}`}
        onRemove={() =>
          patch({
            categoryIds: filters.categoryIds.filter((x) => x !== id),
          })
        }
      />,
    )
  }

  for (const id of filters.projectIds) {
    chips.push(
      <Chip
        key={`proj-${id}`}
        label={`Project · ${labelFor(id, projectOptions)}`}
        onRemove={() =>
          patch({
            projectIds: filters.projectIds.filter((x) => x !== id),
          })
        }
      />,
    )
  }

  for (const id of filters.tagIds) {
    chips.push(
      <Chip
        key={`tag-${id}`}
        label={`Tag · ${labelFor(id, tagOptions)}`}
        onRemove={() =>
          patch({
            tagIds: filters.tagIds.filter((x) => x !== id),
          })
        }
      />,
    )
  }

  if (filters.amountMin.trim() || filters.amountMax.trim()) {
    const min = filters.amountMin.trim()
    const max = filters.amountMax.trim()
    const label =
      min && max
        ? `Amount · ${min}–${max}`
        : min
          ? `Amount · ≥ ${min}`
          : `Amount · ≤ ${max}`
    chips.push(
      <Chip
        key="amount"
        label={label}
        onRemove={() => patch({ amountMin: '', amountMax: '' })}
      />,
    )
  }

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ?? '…'
    const to = filters.dateTo ?? '…'
    chips.push(
      <Chip
        key="date"
        label={`Submitted · ${from} – ${to}`}
        onRemove={() => patch({ dateFrom: null, dateTo: null })}
      />,
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/20 px-3 py-2">
      {chips}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs text-muted-foreground"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  )
}
