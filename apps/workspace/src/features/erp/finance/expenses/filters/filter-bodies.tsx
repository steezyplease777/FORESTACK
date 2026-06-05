// @ts-nocheck

import * as React from 'react'
import { IconCheck, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export type FilterOption = { id: string; label: string }

export function MultiSelectFilterBody({
  label,
  options,
  selectedIds,
  onChange,
}: {
  label: string
  options: FilterOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [search, setSearch] = React.useState('')
  const selectedSet = new Set(selectedIds)
  const needle = search.trim().toLowerCase()
  const filteredOptions = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle))
    : options

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selectedIds.filter((x) => x !== id))
    else onChange([...selectedIds, id])
  }

  return (
    <div className="p-2">
      <Input
        placeholder={`Search ${label.toLowerCase()}…`}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2 h-8"
      />
      <div className="max-h-48 space-y-1 overflow-auto">
        {selectedIds.length > 0 ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted"
          >
            <IconX className="size-3.5" />
            Clear selection
          </button>
        ) : null}
        {filteredOptions.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">No options.</p>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = selectedSet.has(opt.id)
            return (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(opt.id)}
                />
                <IconCheck
                  className={cn(
                    'size-3.5 shrink-0',
                    isSelected ? 'opacity-100' : 'opacity-0',
                  )}
                />
                <span className="truncate">{opt.label}</span>
              </label>
            )
          })
        )}
      </div>
    </div>
  )
}

export function NumberRangeFilterBody({
  min,
  max,
  onChange,
}: {
  min: string
  max: string
  onChange: (min: string, max: string) => void
}) {
  const [draftMin, setDraftMin] = React.useState(min)
  const [draftMax, setDraftMax] = React.useState(max)

  React.useEffect(() => {
    setDraftMin(min)
  }, [min])

  React.useEffect(() => {
    setDraftMax(max)
  }, [max])

  const apply = () => onChange(draftMin, draftMax)

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Min
        </Label>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="No minimum"
          className="mt-1 h-8"
          value={draftMin}
          onChange={(e) => setDraftMin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply()
          }}
        />
      </div>
      <div>
        <Label className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Max
        </Label>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="No maximum"
          className="mt-1 h-8"
          value={draftMax}
          onChange={(e) => setDraftMax(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') apply()
          }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setDraftMin('')
            setDraftMax('')
            onChange('', '')
          }}
        >
          Clear
        </Button>
        <Button type="button" size="sm" className="h-7 text-xs" onClick={apply}>
          Apply
        </Button>
      </div>
    </div>
  )
}

function parseIsoDate(value: string | null): Date | undefined {
  if (!value) return undefined
  const d = new Date(`${value}T00:00:00`)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function formatIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DateRangeFilterBody({
  from,
  to,
  onChange,
}: {
  from: string | null
  to: string | null
  onChange: (from: string | null, to: string | null) => void
}) {
  const fromDate = parseIsoDate(from)
  const toDate = parseIsoDate(to)

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="min-w-0 flex-1">
        <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          From
        </p>
        <Calendar
          mode="single"
          selected={fromDate}
          onSelect={(d) => onChange(d ? formatIsoDate(d) : null, to)}
          className="rounded-md border p-2"
        />
        {from ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full text-xs text-muted-foreground"
            onClick={() => onChange(null, to)}
          >
            Clear from
          </Button>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          To
        </p>
        <Calendar
          mode="single"
          selected={toDate}
          onSelect={(d) => onChange(from, d ? formatIsoDate(d) : null)}
          className="rounded-md border p-2"
        />
        {to ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full text-xs text-muted-foreground"
            onClick={() => onChange(from, null)}
          >
            Clear to
          </Button>
        ) : null}
      </div>
    </div>
  )
}
