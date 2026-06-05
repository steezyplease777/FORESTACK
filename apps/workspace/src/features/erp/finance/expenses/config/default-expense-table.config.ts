import type { ExpenseTableConfig } from '../ExpenseAdminTable.types'

/** Defaults extracted from Softr `expense_admin_table.tsx` editor settings. */
export const DEFAULT_EXPENSE_TABLE_CONFIG: ExpenseTableConfig = {
  columns: [
    'title',
    'status',
    'amount',
    'vendor',
    'expenseCategory',
    'department',
    'relatedProject',
    'invoiceTags',
    'submittedAt',
    'documents',
  ],
  sortableColumns: ['title', 'amount', 'submittedAt'],
  pageSize: 50,
  defaultSortColumn: 'created_at',
  defaultSortDirection: 'desc',
  statusColors: [
    {
      statusName: 'SENT FOR APPROVAL',
      textColor: '#dc2626',
      backgroundColor: '#ffbcb3',
    },
    {
      statusName: 'APPROVED FOR PAYMENT',
      textColor: '#3b82f6',
      backgroundColor: '#dbeafe',
    },
    {
      statusName: 'PENDING',
      textColor: '#f59e0b',
      backgroundColor: '#fef3c7',
    },
    {
      statusName: 'NOT APPROVED',
      textColor: '#d92626',
      backgroundColor: '#fee2e2',
    },
    {
      statusName: 'PAID',
      textColor: '#10b981',
      backgroundColor: '#d1fae5',
    },
  ],
  paymentTypeColors: [
    {
      paymentTypeName: 'ACH',
      textColor: '#374151',
      backgroundColor: '#e5e7eb',
    },
    {
      paymentTypeName: 'PAYPAL',
      textColor: '#386af5',
      backgroundColor: '#dbeafe',
    },
    {
      paymentTypeName: 'CREDIT CARD',
      textColor: '#d92626',
      backgroundColor: '#fee2e2',
    },
    {
      paymentTypeName: 'OTHER',
      textColor: '#8e4ec6',
      backgroundColor: '#ede9fe',
    },
  ],
}
