// @ts-nocheck

import * as React from 'react'
import { IconCheck, IconSelector } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useExpenseDepartmentOptions } from '../data/use-expenses-query'
import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow } from '../ExpenseAdminTable.types'
import {
  useOptimisticDisplay,
  usePopoverTriggerProtection,
} from './combobox-shared'

type DepartmentCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

export function DepartmentCell({ row, companyId, readOnly }: DepartmentCellProps) {
  const update = useExpenseUpdate(companyId)
  const departmentsQuery = useExpenseDepartmentOptions(companyId)
  const departments = departmentsQuery.data ?? []

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const { triggerProps, contentProps } = usePopoverTriggerProtection()

  const optimistic = useOptimisticDisplay(row.departmentValue)
  const displayValue = optimistic.display
  const displayLabel = displayValue
    ? displayValue
        .toLowerCase()
        .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))
    : ''

  const options = React.useMemo(() => {
    const needle = search.trim().toLowerCase()
    const base = departments.map((value) => ({ id: value, label: value }))
    if (!needle) return base
    return base.filter((opt) => opt.label.toLowerCase().includes(needle))
  }, [departments, search])

  const selectDepartment = (value: string | null) => {
    if (value === row.departmentValue) {
      setOpen(false)
      return
    }
    optimistic.apply(value)
    update.mutate(
      { id: row.id, patch: { department: value } },
      {
        onSuccess: () => toast.success('Department updated'),
        onError: (err) => {
          optimistic.revert()
          toast.error('Failed to update department', {
            description: err instanceof Error ? err.message : undefined,
          })
        },
      },
    )
    setOpen(false)
  }

  if (readOnly) {
    return (
      <span className="block truncate text-sm text-foreground">
        {row.department || '—'}
      </span>
    )
  }

  const hasValue = !!displayLabel

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          disabled={update.isPending}
          title={displayLabel || 'Select department'}
          className={cn(
            'flex min-h-6 w-full min-w-0 items-center justify-between gap-1 rounded px-1 text-left text-sm font-medium',
            'text-foreground transition-colors hover:bg-muted/50',
          )}
          {...triggerProps}
        >
          <span className="min-w-0 flex-1 truncate">
            {displayLabel || (
              <span className="text-muted-foreground">—</span>
            )}
          </span>
          {hasValue ? (
            <IconSelector className="size-3 shrink-0 opacity-40" />
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        {...contentProps}
        align="start"
        className="z-[200] w-[280px] p-2"
      >
        <Input
          placeholder="Search department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-56 overflow-auto">
          {departmentsQuery.isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : options.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No departments found.
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {row.departmentValue ? (
                <button
                  type="button"
                  className="rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => selectDepartment(null)}
                >
                  Clear
                </button>
              ) : null}
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => selectDepartment(opt.id)}
                >
                  <IconCheck
                    className={cn(
                      'size-4 shrink-0',
                      row.departmentValue === opt.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
