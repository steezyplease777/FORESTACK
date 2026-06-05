import type { ExpenseTableColumnId } from '../ExpenseAdminTable.types'

export type ExpenseColumnDef = {
  label: string
  /** Pixel width for `table-fixed` + `colgroup`. */
  width: number
  align?: 'left' | 'right'
}

/** Min-width column map — mirrors Softr manage-view proportions. */
export const EXPENSE_COLUMN_DEFS: Record<
  ExpenseTableColumnId,
  ExpenseColumnDef
> = {
  submittedBy: { label: 'Submitted By', width: 160 },
  status: { label: 'Status', width: 140 },
  paymentType: { label: 'Payment type', width: 120 },
  amount: { label: 'Amount', width: 100, align: 'right' },
  title: { label: 'Expense', width: 240 },
  expenseCategory: { label: 'Category', width: 120 },
  vendor: { label: 'Vendor', width: 140 },
  submittedAt: { label: 'Submitted', width: 100 },
  department: { label: 'Department', width: 120 },
  relatedProject: { label: 'Project', width: 140 },
  invoiceTags: { label: 'Tags', width: 140 },
  documents: { label: 'Documents', width: 100 },
  invoiceDate: { label: 'Invoice date', width: 100 },
}

export function expenseTableMinWidth(columns: ExpenseTableColumnId[]): number {
  return columns.reduce(
    (sum, id) => sum + (EXPENSE_COLUMN_DEFS[id]?.width ?? 100),
    0,
  )
}
