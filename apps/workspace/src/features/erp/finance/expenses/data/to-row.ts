import type { ExpenseRecord } from '@/lib/data/erp/expenses/types'

import type { ExpenseRow } from '../ExpenseAdminTable.types'

const toTitleCase = (input: string): string =>
  String(input)
    .toLowerCase()
    .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

export function toExpenseRow(rec: ExpenseRecord): ExpenseRow {
  const attrs =
    rec.attributes && typeof rec.attributes === 'object'
      ? rec.attributes
      : {}

  const amountRaw = rec.amount
  const amountNum =
    typeof amountRaw === 'number'
      ? amountRaw
      : amountRaw != null && amountRaw !== ''
        ? parseFloat(String(amountRaw))
        : NaN

  const expenseProjects = Array.isArray(rec.expense_projects)
    ? rec.expense_projects
    : []
  const projectLabels = expenseProjects
    .map((ep) => toTitleCase(String(ep.project?.name ?? '')))
    .filter(Boolean)

  const departmentStr =
    typeof attrs.department === 'string' ? attrs.department : ''

  return {
    id: rec.id,
    raw: rec,
    title: rec.title ?? '',
    status: rec.status?.name ?? '',
    statusId: rec.status_id ?? rec.status?.id ?? null,
    statusColor: rec.status?.color ?? null,
    amount: Number.isFinite(amountNum) ? amountNum : null,
    vendor: rec.vendor?.name ?? '',
    expenseCategory: toTitleCase(rec.category?.name ?? ''),
    department: toTitleCase(departmentStr),
    relatedProject: projectLabels.join(', '),
    submittedAt: rec.created_at ?? '',
  }
}

export function formatExpenseAmount(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatExpenseDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString()
}
