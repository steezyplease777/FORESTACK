/**
 * Expense admin table — AG Grid implementation (Phase 1).
 * Legacy virtualized `<table>` preserved in `ExpenseAdminTable.legacy.tsx`.
 */
export { ExpenseAgGrid as ExpenseAdminTable, EXPENSE_ROW_HEIGHT } from './ag-grid/ExpenseAgGrid'
export { formatExpenseAmount, formatExpenseDate } from './data/to-row'
