import type { ExpenseRecord } from '@/lib/data/erp/expenses/types'

import type { ExpenseRow } from '../ExpenseAdminTable.types'

const toTitleCase = (input: string): string =>
  String(input)
    .toLowerCase()
    .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))

export function toExpenseRow(
  rec: ExpenseRecord,
  tagsById?: Map<string, string>,
): ExpenseRow {
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
  const projectEntries = expenseProjects
    .map((ep) => ({
      id: ep.project_id || ep.project?.id || '',
      label: toTitleCase(String(ep.project?.name ?? '')),
    }))
    .filter((e) => e.id)

  const tagIds: string[] = Array.isArray(rec.tags) ? rec.tags.map(String) : []
  const tagEntries = tagIds.map((id) => ({
    id,
    label: toTitleCase(tagsById?.get(id) ?? ''),
  }))

  const departmentStr =
    typeof attrs.department === 'string' ? attrs.department : ''

  const documents = Array.isArray(rec.documents) ? rec.documents : []

  const submittedByRaw =
    typeof attrs.softr_submitted_by_name === 'string'
      ? attrs.softr_submitted_by_name.trim()
      : ''

  return {
    id: rec.id,
    raw: rec,
    title: rec.title ?? '',
    submittedBy: submittedByRaw ? toTitleCase(submittedByRaw) : '',
    submittedByAvatar: '',
    status: rec.status?.name ?? '',
    statusId: rec.status_id ?? rec.status?.id ?? null,
    statusColor: rec.status?.color ?? null,
    amount: Number.isFinite(amountNum) ? amountNum : null,
    vendor: rec.vendor?.name ?? '',
    vendorId: rec.vendor_id ?? rec.vendor?.id ?? null,
    expenseCategory: toTitleCase(rec.category?.name ?? ''),
    expenseCategoryId: rec.category_id ?? rec.category?.id ?? null,
    department: toTitleCase(departmentStr),
    departmentValue: departmentStr || null,
    relatedProject: projectEntries.map((e) => e.label).filter(Boolean).join(', '),
    relatedProjectIds: projectEntries.map((e) => e.id),
    invoiceTags: tagEntries,
    invoiceTagsDisplay: tagEntries
      .map((e) => e.label)
      .filter(Boolean)
      .join(', '),
    paymentType:
      typeof attrs.payment_type === 'string' ? attrs.payment_type : '',
    invoiceDate:
      typeof attrs.invoice_date === 'string' ? attrs.invoice_date : '',
    submittedAt: rec.created_at ?? '',
    direction: rec.direction ? String(rec.direction) : '',
    attributes: attrs,
    documents,
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
