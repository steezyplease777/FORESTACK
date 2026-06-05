# Cold storage — AG Grid Phase 1 experiment

Not used in production. The expenses page renders the legacy virtualized shadcn table via `ExpenseAdminTable.tsx`.

To re-enable AG Grid, wire `ExpenseAgGrid` in `ExpenseAdminTable.tsx`:

```tsx
export { ExpenseAgGrid as ExpenseAdminTable, EXPENSE_ROW_HEIGHT } from './ag-grid/ExpenseAgGrid'
export { formatExpenseAmount, formatExpenseDate } from './data/to-row'
```

Dependencies (`ag-grid-community`, `ag-grid-react`) remain installed for future use.
