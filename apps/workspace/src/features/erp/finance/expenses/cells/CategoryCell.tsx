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

import { useExpenseCategories } from '../data/use-expenses-query'
import { useExpenseUpdate } from '../data/use-expense-update'
import type { ExpenseRow } from '../ExpenseAdminTable.types'
import {
  useOptimisticDisplay,
  usePopoverTriggerProtection,
} from './combobox-shared'

type CategoryCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

export function CategoryCell({ row, companyId, readOnly }: CategoryCellProps) {
  const update = useExpenseUpdate(companyId)
  const categoriesQuery = useExpenseCategories(companyId)
  const categories = categoriesQuery.data ?? []

  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const { triggerProps, contentProps } = usePopoverTriggerProtection()

  const optimistic = useOptimisticDisplay(row.expenseCategoryId)
  const displayId = optimistic.display
  const displayLabel =
    categories.find((c) => c.id === displayId)?.name ?? row.expenseCategory

  const options = React.useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return categories
    return categories.filter((c) => c.name.toLowerCase().includes(needle))
  }, [categories, search])

  const selectCategory = (categoryId: string | null) => {
    if (categoryId === row.expenseCategoryId) {
      setOpen(false)
      return
    }
    optimistic.apply(categoryId)
    update.mutate(
      { id: row.id, patch: { category_id: categoryId } },
      {
        onSuccess: () => toast.success('Category updated'),
        onError: (err) => {
          optimistic.revert()
          toast.error('Failed to update category', {
            description: err instanceof Error ? err.message : undefined,
          })
        },
      },
    )
    setOpen(false)
  }

  if (readOnly || categories.length === 0) {
    return (
      <span className="block truncate text-sm text-foreground">
        {row.expenseCategory || '—'}
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
          title={displayLabel || 'Select category'}
          className={cn(
            'flex min-h-6 w-full min-w-0 items-center justify-between gap-1 rounded px-1 text-left text-sm font-normal',
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
        className="z-[200] w-[300px] p-2"
      >
        <Input
          placeholder="Search category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-56 overflow-auto">
          {categoriesQuery.isLoading ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : options.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No categories found.
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {row.expenseCategoryId ? (
                <button
                  type="button"
                  className="rounded px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => selectCategory(null)}
                >
                  Clear
                </button>
              ) : null}
              {options.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => selectCategory(category.id)}
                >
                  <IconCheck
                    className={cn(
                      'size-4 shrink-0',
                      displayId === category.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
