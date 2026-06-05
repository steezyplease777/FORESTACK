// @ts-nocheck

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useExpenseUpdate } from '../data/use-expense-update'
import { useExpenseCategories } from '../data/use-expenses-query'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

type CategoryCellProps = {
  row: ExpenseRow
  companyId: string
  readOnly?: boolean
}

export function CategoryCell({ row, companyId, readOnly }: CategoryCellProps) {
  const update = useExpenseUpdate(companyId)
  const categoriesQuery = useExpenseCategories(companyId)
  const categories = categoriesQuery.data ?? []

  if (readOnly || categories.length === 0) {
    return (
      <span className="truncate text-xs text-muted-foreground">
        {row.expenseCategory || '—'}
      </span>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={update.isPending}>
        <button
          type="button"
          className="max-w-full truncate text-left text-xs text-muted-foreground hover:underline"
        >
          {row.expenseCategory || 'Set category'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-64 overflow-auto">
        <DropdownMenuItem
          onClick={() => {
            if (!row.expenseCategoryId) return
            update.mutate({ id: row.id, patch: { category_id: null } })
          }}
        >
          <span className="text-muted-foreground">Clear</span>
        </DropdownMenuItem>
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => {
              if (category.id === row.expenseCategoryId) return
              update.mutate({
                id: row.id,
                patch: { category_id: category.id },
              })
            }}
          >
            {category.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
