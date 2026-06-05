import type { TablerIcon } from '@tabler/icons-react'
import {
  IconCircleDot,
  IconClock,
  IconCreditCard,
  IconFile,
  IconFileText,
  IconFolder,
  IconHash,
  IconTag,
  IconTypography,
  IconUser,
} from '@tabler/icons-react'

import type { ExpenseTableColumnId } from '../ExpenseAdminTable.types'

export type ExpenseColumnDef = {
  label: string
  /** Pixel min-width for `colgroup` + horizontal scroll layout. */
  width: number
  align?: 'left' | 'right'
  /** Tabler icon for spreadsheet-style column header. */
  icon?: TablerIcon
}

/** Min-width column map — mirrors Softr manage-view proportions. */
export const EXPENSE_COLUMN_DEFS: Record<
  ExpenseTableColumnId,
  ExpenseColumnDef
> = {
  submittedBy: { label: 'Submitted By', width: 160, icon: IconUser },
  status: { label: 'Status', width: 140, icon: IconCircleDot },
  paymentType: { label: 'Payment Type', width: 120, icon: IconCreditCard },
  amount: { label: 'Amount', width: 100, align: 'right', icon: IconHash },
  title: { label: 'Expense', width: 240, icon: IconTypography },
  expenseCategory: { label: 'Category', width: 120, icon: IconFileText },
  vendor: { label: 'Vendor', width: 140, icon: IconUser },
  submittedAt: { label: 'Submitted', width: 100, icon: IconClock },
  department: { label: 'Department', width: 120, icon: IconFolder },
  relatedProject: { label: 'Project', width: 140, icon: IconFolder },
  invoiceTags: { label: 'Tags', width: 140, icon: IconTag },
  documents: { label: 'Documents', width: 100, icon: IconFile },
  invoiceDate: { label: 'Invoice date', width: 100, icon: IconClock },
}

export const EXPENSE_CHECKBOX_COLUMN_WIDTH = 40
export const EXPENSE_ACTIONS_COLUMN_WIDTH = 40

export function expenseTableMinWidth(columns: ExpenseTableColumnId[]): number {
  return (
    EXPENSE_CHECKBOX_COLUMN_WIDTH +
    EXPENSE_ACTIONS_COLUMN_WIDTH +
    columns.reduce(
      (sum, id) => sum + (EXPENSE_COLUMN_DEFS[id]?.width ?? 100),
      0,
    )
  )
}
