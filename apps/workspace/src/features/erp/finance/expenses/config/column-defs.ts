import type { TablerIcon } from '@tabler/icons-react'
import {
  IconArrowDownLeft,
  IconCalendar,
  IconCircleDot,
  IconClock,
  IconCreditCard,
  IconFile,
  IconFileText,
  IconFolder,
  IconHash,
  IconInfoCircle,
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
  status: { label: 'Status', width: 180, icon: IconCircleDot },
  paymentType: { label: 'Payment Type', width: 140, icon: IconCreditCard },
  amount: { label: 'Invoice Amount', width: 120, align: 'right', icon: IconHash },
  title: { label: 'Invoice Title', width: 300, icon: IconTypography },
  expenseCategory: { label: 'Expense Category', width: 220, icon: IconFileText },
  vendor: { label: 'Vendor', width: 140, icon: IconUser },
  department: { label: 'Department', width: 160, icon: IconFolder },
  invoiceDate: { label: 'Invoice Date', width: 120, icon: IconCalendar },
  submittedAt: { label: 'Submission Date', width: 140, icon: IconClock },
  direction: { label: 'Direction', width: 120, icon: IconArrowDownLeft },
  attributes: { label: 'Attributes', width: 200, icon: IconInfoCircle },
  documents: { label: 'Documents', width: 180, icon: IconFile },
  invoiceTags: { label: 'Tags', width: 160, icon: IconTag },
  relatedProject: { label: 'Project', width: 180, icon: IconFolder },
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
