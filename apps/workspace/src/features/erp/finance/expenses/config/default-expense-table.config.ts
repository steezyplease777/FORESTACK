import type { ExpenseTableConfig } from '../ExpenseAdminTable.types'

/** Defaults extracted from Softr `expense_admin_table.tsx` editor settings. */
export const DEFAULT_EXPENSE_TABLE_CONFIG: ExpenseTableConfig = {
  columns: [
    'submittedBy',
    'status',
    'paymentType',
    'amount',
    'title',
    'expenseCategory',
    'department',
    'invoiceDate',
    'submittedAt',
    'direction',
    'attributes',
    'documents',
    'invoiceTags',
    'relatedProject',
  ],
  sortableColumns: [
    'title',
    'amount',
    'submittedAt',
    'status',
    'expenseCategory',
    'paymentType',
    'invoiceDate',
    'department',
    'direction',
  ],
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
  bulkActionsEnabled: true,
  bulkActions: [
    {
      label: 'Export',
      actionType: 'export',
      style: 'secondary',
    },
    {
      label: 'Delete',
      actionType: 'delete',
      style: 'destructive',
      requireConfirmation: true,
      confirmationTitle: 'Delete selected?',
      confirmationMessage:
        'This will permanently delete the selected records. This action cannot be undone.',
      confirmButtonLabel: 'Delete',
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
