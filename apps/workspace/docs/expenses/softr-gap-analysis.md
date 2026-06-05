# Softr Invoice/Expense Admin Table → Forestack Gap Analysis

**Date:** 2026-06-04  
**Branch:** `feat/erp-finance-expenses`  
**Softr source:** `/Users/charlieclyde/Desktop/SOFTR-AGAIN/shitty_ai_code/EXPENSE-BLOCKS/expense_admin_table.tsx` (13,340 lines)  
**Forestack:** `apps/workspace/src/features/erp/finance/expenses/`  
**Live reference:** https://fa-internal-app.softr.app/invoices?page=ADMIN (browser snapshot captured)

**Note:** Another agent is restoring all columns + container-fit layout in parallel — this doc describes gaps only, no implementation.

---

## Live vs source divergence

The **live MANAGE tab** is an **editor-customized subset** of the Softr block defaults:

| Aspect | Live MANAGE (snapshot) | Softr source defaults (`sortableColumns` initialValue ~L9183) |
|--------|------------------------|---------------------------------------------------------------|
| Visible columns | Title, Category, Department, Invoice Due Date, Submitted At, Direction, ⋯ actions | 14 columns: submittedBy, status, paymentType, amount, title, category, department, invoiceDate, submittedAt, direction, attributes, documents, tags, project |
| Checkbox column | **Not visible** (bulk likely disabled in prod editor) | `bulk-actions-enabled` default `enabled` |
| Search placeholder | `Search invoices…` | Same in `InvoiceTableToolbar` |
| Page footer | `307 rows` · `Page 1 of 13` (~25/page) | `page-size` default **25** (`useSelectSetting` ~L9348) |
| Status tabs in toolbar | **None** (SUBMISSIONS/MANAGE/VIEWS are **page-level** Softr nav, not block toolbar) | No status tabs in `InvoiceTableToolbar` either |
| Inline edit visible | Category + Department combobox chevrons | `SingleLinkComboboxCell` for both |

Forestack `DEFAULT_EXPENSE_TABLE_CONFIG` mirrors **source defaults** (14 cols), not the live 6-column layout.

---

## 1. Toolbar

| Feature | Softr (`InvoiceTableToolbar` ~L6180) | Forestack (`ExpenseTableToolbar.tsx`) | Status |
|---------|--------------------------------------|---------------------------------------|--------|
| Full-width search | `searchText` → `Search invoices…` | `q` debounced → `Search expenses…` | **Done** (label differs) |
| Clear search (×) | Yes | Yes | **Done** |
| Filter button + count badge | Nested `DropdownMenu` submenus (`FilterSubMenu`) | Right `Sheet` (`ExpenseStructuredFilters`) | **Partial** — UX differs (dropdown vs sheet) |
| Group button | Working `setGrouping([colId])` + active label `Group · {field}` | `Group` dropdown, all options **disabled** | **Missing** |
| Status tabs | N/A in block | N/A (status in Filter sheet) | **N/A** |
| Filter chips strip | Inline chips below toolbar (via filter state) | `ExpenseFilterChips.tsx` | **Done** |
| Page-level tabs (SUBMISSIONS/MANAGE/VIEWS) | Softr app shell | Not in Forestack route | **Out of scope** (workspace routing) |
| Column picker | Editor-only (`sortable-columns` setting) | Fixed `DEFAULT_EXPENSE_TABLE_CONFIG` | **Missing** (runtime) |
| Padding / density settings | `useSelectSetting` row-density, padding | Tailwind page shell | **Dropped** (intentional) |

---

## 2. Columns

### Softr source — all configurable columns (`sortableColumns` ~L9099–9196)

| columnKey | Label | defaultWidth | Sortable (source) | Editable cell (source) |
|-----------|-------|-------------:|-------------------|------------------------|
| `submittedBy` | Submitted By | 160 | Yes | `SubmittedByCell` (read-only) |
| `status` | Status | 180 | Yes | `StatusComboboxCell` |
| `paymentType` | Payment Type | 140 | Yes | `PaymentTypeComboboxCell` |
| `amount` | Invoice Amount | 120 | Yes | `EditableCurrencyCell` |
| `title` | Invoice Title | 300 | Yes | `EditableTextCell` + hover **Open** button |
| `expenseCategory` | Expense Category | 220 | Yes | `SingleLinkComboboxCell` |
| `department` | Department | 160 | Yes | `SingleLinkComboboxCell` |
| `invoiceDate` | Invoice Date | 120 | Yes | `EditableDateCell` (fieldKey `invoiceDueDate`) |
| `submittedAt` | Submission Date | 140 | Yes | Read-only `formatDate` |
| `direction` | Direction | 120 | Yes | `DirectionCell` (badge) |
| `attributes` | Attributes | 200 | No | `AttributesCell` (credit-card tiles + uncategorized ⋯) |
| `documents` | Documents | 180 | No | `DocumentsCell` (tiles, upload, preview/navigate) |
| `invoiceTags` | Tags | 160 | Yes | `InvoiceTagComboboxCell` (+ tag create via Softr REST) |
| `project` | Project | 180 | Yes | `ProjectComboboxCell` (multi-select) |

*Forestack uses `relatedProject` as column id; Softr editor key is `project`.*

### Forestack default (`default-expense-table.config.ts` + `column-defs.ts`)

Same 14 column ids (with `relatedProject` not `project`). Widths/labels match Softr proportions.

| columnKey | Forestack cell | Sortable | Editable today |
|-----------|----------------|----------|----------------|
| `submittedBy` | `SubmittedByCell.tsx` | No | No |
| `status` | `StatusCell.tsx` | Yes | **Yes** (dropdown) |
| `paymentType` | `PaymentTypeCell.tsx` | Yes | **No** (badge + chevron only) |
| `amount` | `AmountCell.tsx` | Yes | **Yes** |
| `title` | `TitleCell.tsx` | Yes | **Yes** (no hover Open) |
| `expenseCategory` | Plain `<span>` in `ExpenseAdminTable.tsx` ~L502 | Yes | **No** (`CategoryCell.tsx` exists, **not wired**) |
| `department` | Plain `<span>` ~L508 | Yes | **No** |
| `invoiceDate` | `DateCell.tsx` | Yes | **No** |
| `submittedAt` | `DateCell.tsx` | Yes | No |
| `direction` | `DirectionCell.tsx` | Yes | No |
| `attributes` | `AttributesCell.tsx` (credit-card tiles + ⋯ hover) | No | No |
| `documents` | `DocumentsCell.tsx` | No | **Partial** (preview/upload when wired from page) |
| `invoiceTags` | `TagsCell.tsx` (read-only badges) | No | **No** |
| `relatedProject` | Plain `<span>` ~L514 | No | **No** |
| `vendor` | `VendorCell.tsx` | — | **Yes** but **not in default columns** |

### Live MANAGE visible columns (snapshot)

Title · Category · Department · Invoice Due Date · Submitted At · Direction · ⋯ — **no** status, amount, submittedBy, paymentType, attributes, documents, tags, checkboxes.

---

## 3. Table chrome

| Feature | Softr | Forestack (`ExpenseAdminTable.tsx`) | Status |
|---------|-------|-------------------------------------|--------|
| Raw `<table>` (not shadcn Table wrapper) | Yes (~L12070) | Yes | **Done** |
| `border-separate` + per-cell borders | Yes | `border-separate border-spacing-0` + `border-r/b` | **Done** |
| Row height | Configurable `row-density` | Fixed `EXPENSE_ROW_HEIGHT = 48` (`h-12`) | **Partial** |
| Sticky header | `position: sticky` on `<th>` | `sticky top-0 z-10` on `<th>` | **Done** |
| Checkbox column | 36px when `bulkActionsEnabled === 'enabled'` | 40px when `bulkActionsEnabled` | **Done** (live: off) |
| Actions column | Sticky right (`z-index`, painted border) | 40px, **not sticky** on horizontal scroll | **Partial** |
| Horizontal scroll | `table.getTotalSize()` + `columnSizeVars` | `minWidth` from `expenseTableMinWidth()` | **Partial** |
| Column resize | TanStack `columnResizeMode: 'onChange'`, drag handles (~L11365) | Fixed `colgroup` minWidths | **Missing** |
| `table-layout: fixed` | Yes | Implicit via col widths | **Partial** |
| Webhook loading overlay | Frosted blur over table (~L11999) | None | **Missing** |
| Footer inside card | `invoice-table-footer` muted bar | `expenses-page.tsx` border-t footer | **Done** |

---

## 4. Interactions

| Interaction | Softr component | Forestack | Status |
|-------------|-----------------|-----------|--------|
| Inline title edit | `EditableTextCell` | `TitleCell` click-to-edit | **Done** |
| Title hover **Open** → record modal | `openRecordModal()` in title cell (~L10112) | None | **Missing** (P0) |
| Status combobox | `StatusComboboxCell` | `StatusCell` | **Done** |
| Payment type combobox | `PaymentTypeComboboxCell` | `PaymentTypeCell` read-only | **Missing** (P1) |
| Amount currency edit | `EditableCurrencyCell` | `AmountCell` | **Done** |
| Vendor link combobox | `SingleLinkComboboxCell` (vendor N/A in default cols) | `VendorCell` | **Partial** |
| Category combobox | `SingleLinkComboboxCell` | `CategoryCell` **unwired** | **Missing** (P0 for live) |
| Department combobox | `SingleLinkComboboxCell` | Plain text | **Missing** (P0 for live) |
| Project multi-combobox | `ProjectComboboxCell` | Plain text | **Missing** (P2) |
| Tags combobox + create | `InvoiceTagComboboxCell` | `TagsCell` read-only | **Missing** (P2) |
| Invoice date picker | `EditableDateCell` | `DateCell` read-only | **Missing** (P1) |
| Direction badge | `DirectionCell` | `DirectionCell` | **Done** |
| Attributes tiles | `AttributesCell` + credit card catalog | `AttributesCell` + `getCreditCardsCatalog` | **Done** (~85%) |
| Documents upload/drop | `DocumentsCell` + `DocumentUploadDialog` | `DocumentsCell` + dialogs (page wires upload) | **Partial** |
| Document preview | `DocumentPreviewDialog` | `DocumentPreviewDialog.tsx` | **Partial** |
| Row ⋯ menu | `RowActionsMenu` + `NavigationAction` (~L6540) | `RowActionsCell` — disabled View/Edit stubs | **Missing** (P0) |
| Read-only embed | `ReadOnlyContext` | `readOnly` prop (unused on route) | **Partial** |
| Draggable row reorder | DnD block (~L7622) | Dropped | **N/A** |

---

## 4a. Attributes column (detailed)

Softr source: `AttributesCell` ~L2890–2987, `useCreditCardsCatalog` ~L2521–2558, `parseCreditCardAttributeRefs` ~L2560–2584.

### Data shape (`erp_expenses.attributes` jsonb)

Read-only in the admin table. Primary formatted key:

```json
{
  "credit_cards": [{ "id": "<erp_credit_cards.uuid>" }],
  "payment_type": "CREDIT CARD",
  "department": "Marketing",
  "invoice_date": "2024-06-01",
  "invoice_paid_date": null,
  "softr_submitted_by_name": "Taylor Pursley"
}
```

Legacy rows may use `[{ "label": "Holder · Chase •• 1234" }]` or plain strings instead of catalog IDs.

### Catalog resolution

Softr loads `erp_credit_cards` per company (stale 5 min):

- `id, card_number, bank, company_user:app_company_users(org_user:app_organization_users(first_name, last_name, email))`
- `Map<id, { title, last4, bankLabel, holderName }>` — `title` = `"{holder} · {bankLabel} •• {last4}"`
- Bank labels via `CREDIT_CARD_BANK_LABEL_BY_ID` (AMEX → American Express, etc.)

Forestack: `getCreditCardsCatalog` in `lib/data/erp/expenses/server.ts` (same embed via `company_user_id`), `useCreditCardsCatalog` hook, passed to table as `creditCardsById`.

### Keys excluded from ⋯ panel

| Key | Dedicated column |
| --- | --- |
| `payment_type` | Payment Type |
| `department` | Department |
| `invoice_date` | Invoice Date |
| `invoice_paid_date` | (not in default cols) |
| `softr_submitted_by_name` | Submitted By (Forestack only) |

### Visual + interaction

| Element | Softr | Forestack |
| --- | --- | --- |
| Credit-card tiles | Up to 4 × 28px `credit-card` icon buttons | Same (`IconCreditCard`, `ATTRIBUTES_CELL_VISIBLE = 4`) |
| Overflow | `+N` text | Same |
| ⋯ tile | `more-horizontal` when unmapped keys remain | `IconDots` + Field/Value table on hover |
| Card hover | HoverCard: "Credit card", `{holder} · {bank}`, `*******{last4}` | Tooltip with same content |
| Empty | `—` | `—` |
| Editable | No | No |
| Click | Hover only; `stopPropagation` on tiles | Same |

### Remaining gaps (~15%)

| Gap | Severity |
| --- | --- |
| HoverCard vs Tooltip styling | Low |
| Block editor `attributeDisplayRows` tile overrides | Low (deferred) |
| Catalog prefetch in route loader | Low |
| Attributes sort/filter | N/A (Softr has none) |

**Files:** `cells/AttributesCell.tsx`, `credit-card-catalog.ts`, `server.ts`, `expenses-page.tsx`.

---

## 5. Filters

### Softr `ActiveFilters` (~L5455) + `rowPassesFilters` (~L5510)

| Field | UI location | Server/query |
|-------|-------------|--------------|
| `searchText` | Toolbar | Client global filter + server where |
| `titleContains` | Filter submenu `TextContainsFilterBody` | Client + server |
| `amountMin` / `amountMax` | Filter submenu | Client + server |
| `dateFrom` / `dateTo` | Filter submenu (invoice date) | Client + server |
| `filterDepartmentIds` | Multi-select | Server |
| `filterCategoryIds` | Multi-select | Server |
| `filterProjectIds` | Multi-select | Server |
| `filterTagIds` | Multi-select | Server |
| **Status** | **Not in Softr `ActiveFilters`** | — |

### Forestack (`ActiveFilters` in `ExpenseAdminTable.types.ts` + `query-builder.ts`)

| Field | Status vs Softr |
|-------|-----------------|
| `q` (search) | **Done** (maps `searchText`) |
| `statusIds` | **Forestack-only enhancement** (not in Softr source toolbar) |
| `categoryIds`, `projectIds`, `departmentValues`, `tagIds` | **Done** |
| `amountMin`, `amountMax` | **Done** |
| `dateFrom`, `dateTo` | **Done** (labeled "Submitted date" in sheet; Softr filters **invoice date**) |
| `titleContains` | **Missing** |
| External `?filters=` JSON embed | Softr `parseExternalFilters` (~L5557) | **Missing** (P2) |

**Filter UX:** Softr nested dropdown (`FilterSubMenu`); Forestack right sheet — functionally similar, visually different.

---

## 6. Grouping

| Feature | Softr | Forestack | Status |
|---------|-------|-----------|--------|
| Group-by fields | `GROUP_FIELD_KEYS` (~L5497): status, paymentType, department, expenseCategory, relatedProject, invoiceTags, submittedBy | Toolbar stub only | **Missing** |
| `GROUP_FIELD_TO_COLUMN_ID` | Maps `relatedProject` → `project` | — | **Missing** |
| Section headers + collapse | Group header rows in `viewItems` | — | **Missing** |
| Per-group fetch | `SectionDataFetcher` + `useRecords` per section (~L8177) | — | **Missing** |
| Per-group infinite scroll | Sentinel rows per section | — | **Missing** |
| Group sums | `showGroupSums` + `useChartData` | — | **Missing** |
| Group-aware footer | `"{N} records in {G} groups"` (~L13205) | Standard pagination only | **Missing** |
| Global checkbox in grouped mode | Disabled + tooltip (~L12105) | N/A | **Missing** |

---

## 7. Bulk actions

| Feature | Softr (`BulkActionsToolbar` ~L6975) | Forestack (`BulkActionsToolbar.tsx` + `use-expense-bulk-actions.ts`) | Status |
|---------|---------------------------------------|----------------------------------------------------------------------|--------|
| Floating toolbar on selection | Absolute above footer (~L13154) | Inline below toolbar in card | **Partial** (position differs) |
| `{N} selected` + Clear | Yes | Yes | **Done** |
| Select all matching (`onSelectAllMatching`) | Yes (~L7362) | No | **Missing** (P1) |
| Selection persists across pages | Yes | Yes (`expenses-page.tsx` ~L158) | **Done** |
| URL selection sync (`bulkUrlSync`) | `?recordIds=` hydrate (~L8840) | No | **Missing** (P2) |
| Change status | Via navigation/webhook in editor | `handleChangeStatus` → `useBulkExpenseUpdate` | **Done** |
| Export | `onExport('all' \| string[])` + field picker dropdown | Toast "coming soon" | **Missing** (P1) |
| Delete | Navigation to `/invoice-bulk-delete` modal | Toast "coming soon" | **Missing** (P1) |
| Webhook actions | `runWebhookAction` (~L7137): URL, method, headers, body, toasts, refetch | Not supported (`ExpenseBulkActionType` limited) | **Missing** (P1) |
| Confirm dialog | `BulkActionConfirmDialog` for webhooks | `ConfirmDialog` for delete only | **Partial** |
| Default editor actions | Bulk Edit + Delete Selected (navigation modals ~L8977) | Change status + Export + Delete (in-app) | **Partial** (different action model) |
| Live prod | Checkboxes **not shown** | Checkboxes **on** (`bulkActionsEnabled: true`) | **Divergence** |

---

## 8. Pagination

| Feature | Softr | Forestack (`expenses-page.tsx`) | Status |
|---------|-------|--------------------------------|--------|
| Page size default | **25** (`page-size` setting) | **50** (`DEFAULT_EXPENSE_TABLE_CONFIG.pageSize` + shared `DEFAULT_PAGE_SIZE`) | **Partial** |
| Page size options | 10, 25, 50, 100, 200 (editor) | URL `pageSize` up to `MAX_PAGE_SIZE` | **Partial** (no UI picker) |
| Footer left | `{total} rows` | `{total} rows` | **Done** |
| Footer right | `Page X of Y` + first/prev/next/last | Same icon buttons | **Done** |
| Server pagination | `useRecords` + `pageIndex` (~L10932) | `erpExpensesListQuery` + route search | **Done** |
| Auto-fetch pages for deep jump | `useEffect` prefetch (~L11200) | Single page fetch per navigation | **Partial** |
| Grouped mode footer | No page controls; group summary | N/A | **Missing** |

---

## 9. Virtualization

| Mode | Softr | Forestack | Status |
|------|-------|-----------|--------|
| Ungrouped | `useVirtualizer` over current page rows; sticky header | `useVirtualizer` in `ExpenseAdminTable.tsx` (~L88), 48px rows, spacer `<tr>`s | **Done** (~90%) |
| Grouped | Single virtualizer over `viewItems` (headers + rows + sentinels) | Not implemented | **Missing** |
| Overscan | `defaultRangeExtractor` customization | `overscan: 10` | **Done** |

---

## 10. Missing / partial / done checklist

| Item | Priority | Status |
|------|----------|--------|
| Grouped view (`SectionDataFetcher`, `GROUP_FIELD_KEYS`) | **P0** | Missing |
| Wire `CategoryCell` + department combobox (live has these) | **P0** | Partial (cell exists, unwired) |
| Title hover Open + expense detail route/modal | **P0** | Missing |
| Row actions menu (`RowActionsMenu` → Open/Delete navigation) | **P0** | Partial (shell only) |
| Select all matching + deselect all (`selectAllMatching`) | **P1** | Missing |
| Bulk export with field picker + CSV download | **P1** | Missing |
| Bulk delete (server mutation) | **P1** | Missing |
| Bulk webhook actions + loading overlay | **P1** | Missing |
| `PaymentTypeComboboxCell` parity | **P1** | Missing |
| Column resize + `--header-*-size` CSS vars | **P1** | Missing |
| Sticky right actions column on horizontal scroll | **P1** | Missing |
| `EditableDateCell` for invoice/due date | **P1** | Missing |
| `titleContains` structured filter | **P2** | Missing |
| `ProjectComboboxCell` + `InvoiceTagComboboxCell` | **P2** | Missing |
| Attributes credit-card catalog tiles + uncategorized hover | **P2** | **Done** (~85%; see §4a) |
| Bulk selection URL sync | **P2** | Missing |
| External `?filters=` embed contract | **P2** | Missing |
| Runtime column picker / editor column enable | **P2** | Missing |
| Page size selector UI | **P2** | Missing |
| Toolbar search/filter/group layout | — | **Done** |
| Server-side list + sort URL sync | — | **Done** |
| Status/amount/title inline edit | — | **Done** |
| Virtualized ungrouped body + sticky header | — | **Done** |
| Pagination footer (rows + page nav) | — | **Done** |
| Structured filters (dept/cat/project/tags/amount/date) | — | **Done** |
| Bulk toolbar + change status mutation | — | **Done** |
| Documents cell + upload/preview plumbing | — | **Partial** |
| Direction + submittedBy display | — | **Partial** |

---

## Parity estimate

| Baseline | Estimate | Rationale |
|----------|----------|-----------|
| **Softr source block** (full 13k-line capability) | **~48%** | Core flat table + filters + virtualization + partial bulk; missing grouping, most combobox cells, Open/detail, row actions, resize/sticky, webhooks, export |
| **Live MANAGE tab** (production editor config) | **~55%** | Fewer columns visible; Forestack exceeds live on bulk/checkboxes/status filter but **lags** on category/department inline edit and column set alignment |

*Prior doc (`softr-migration-breakdown.md`) estimated ~42%; bulk toolbar + expanded columns/filters raise this slightly.*

---

## Key file reference map

| Concern | Softr | Forestack |
|---------|-------|-----------|
| Toolbar | `InvoiceTableToolbar` | `filters/ExpenseTableToolbar.tsx` |
| Filters | `rowPassesFilters`, `FilterSubMenu` ~L5451 | `filters/ExpenseStructuredFilters.tsx`, `data/query-builder.ts` |
| Table body | Block render ~L11975+ | `ExpenseAdminTable.tsx` |
| Bulk | `BulkActionsToolbar` ~L6975 | `bulk/BulkActionsToolbar.tsx`, `bulk/use-expense-bulk-actions.ts` |
| Page shell | Block component ~L8403 | `features/company/pages/erp/expenses-page.tsx` |
| Route/search | — | `routes/.../erp/finance/expenses/index.tsx` |
| Config | `useArraySetting('sortable-columns')` | `config/default-expense-table.config.ts` |

---

## Top 10 missing items (priority order)

1. **Grouped view** — `SectionDataFetcher`, group headers, per-group pagination/infinite scroll  
2. **Category + department inline comboboxes** — wire `CategoryCell`; add department combobox (`SingleLinkComboboxCell` parity)  
3. **Title Open button + expense detail route** — `openRecordModal` / modal or TanStack detail route  
4. **Row actions menu** — Open + Delete (Softr `rowActions` default ~L9075)  
5. **Select all matching** — `selectAllMatching` + `matchingTotal` in bulk toolbar  
6. **Bulk export** — field picker + CSV (`handleBulkExport` / `exportFieldOptions`)  
7. **Bulk delete** — server mutation (not toast stub)  
8. **Payment type editable combobox** — `PaymentTypeComboboxCell`  
9. **Column resize + sticky actions column** — TanStack `columnResizeMode: 'onChange'`  
10. **Editable invoice/due date** — `EditableDateCell` on `invoiceDate` column  

---

## Suggested doc maintenance

- Keep `apps/workspace/docs/expenses/softr-migration-breakdown.md` as line-count / phase migration reference.  
- Use this file as the **living parity checklist**; update parity % when grouped view or row-open lands.

---

**Return summary**

| | |
|--|--|
| **Doc path** | `apps/workspace/docs/expenses/softr-gap-analysis.md` (content above — not written in Ask mode) |
| **Parity %** | **~48%** vs Softr source · **~55%** vs live MANAGE |
| **Top 10 gaps** | Grouping · category/dept combobox · title Open/detail · row actions · select-all-matching · bulk export · bulk delete · payment-type edit · column resize/sticky actions · editable invoice date |
