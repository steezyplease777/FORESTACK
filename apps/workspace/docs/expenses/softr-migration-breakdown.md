# Softr expense admin table → Forestack migration breakdown

Source: `SOFTR-AGAIN/shitty_ai_code/EXPENSE-BLOCKS/expense_admin_table.tsx` (**13,340 lines**).

Target: `apps/workspace/src/features/erp/finance/expenses/` + `apps/workspace/src/lib/data/erp/expenses/`.

Branch: `feat/erp-finance-expenses` (partial v1 shell exists).

---

## Line count by concern

| Concern | Lines | Range | Notes |
| --- | ---: | --- | --- |
| Header / imports | 215 | 1–215 | Softr datasource hooks, UI kit |
| Supabase config + runtime | 147 | 216–362 | `SB_RUNTIME`, table constants |
| `SB_FIELD_MAP` + query builder | 406 | 363–768 | Semantic → PostgREST mapping |
| Compat data hooks | 486 | 769–1254 | `useRecords`, `useRecordUpdate`, `useUpload` shim |
| Field map `q.select` + choices | 389 | 1255–1643 | Status/payment type palettes |
| Utility hooks | 87 | 1644–1730 | Optimistic display, trigger protection |
| Chips + hover panels | 323 | 1731–2053 | Shared chip strip UI |
| Documents map / types hooks | 285 | 2054–2338 | **Softr REST** document enrichment |
| `toRow` + `InvoiceRow` | 182 | 2339–2520 | Row normalizer |
| Credit cards + attributes | 468 | 2521–2988 | JSONB attribute tiles |
| Direction + SubmittedBy cells | 130 | 2989–3118 | |
| Document upload dialog | 329 | 3119–3447 | Softr upload pipeline |
| Document preview dialog | 413 | 3448–3860 | In-block preview |
| Documents cell | 346 | 3861–4206 | Tiles + upload affordance |
| Editable text cell | 112 | 4207–4318 | |
| Editable currency cell | 125 | 4319–4443 | |
| Editable date cell | 207 | 4444–4650 | |
| Status combobox cell | 100 | 4651–4750 | |
| Payment type combobox | 97 | 4751–4847 | |
| Single-link combobox | 156 | 4848–5003 | Vendor/category pattern |
| Project combobox | 176 | 5004–5179 | Multi-select projects |
| Invoice tag combobox | 271 | 5180–5450 | Tag create via Softr REST |
| Filters + query building | 729 | 5451–6179 | Client + server where clauses |
| `InvoiceTableToolbar` | 387 | 6180–6566 | Search + structured filters |
| Row actions + navigation | 218 | 6567–6784 | `NavigationAction` |
| Bulk confirm dialog | 190 | 6785–6974 | |
| Bulk actions toolbar | 647 | 6975–7621 | Checkboxes + webhooks |
| Draggable row + table body | 527 | 7622–8148 | DnD reorder (Softr-only UX) |
| Grouped mode | 254 | 8149–8402 | Section fetchers, infinite scroll |
| Block component | 4,938 | 8403–13340 | Settings + render orchestration |

**Largest slices:** Block settings/render (37%), filters (5.5%), bulk actions (4.8%), compat hooks (3.6%).

---

## `use*Setting` → `ExpenseTableConfig`

| Softr hook | Config field | Drop / defer |
| --- | --- | --- |
| `useTextSetting` `supabase-company-id` | — | **Drop** — use `useCompany().companyId` |
| `useTextSetting` `block-title` / `block-subtitle` | — | **Drop** — `PageHeader` on route |
| `useSelectSetting` `block-title-align` | — | Drop |
| `useVibeCodingBlockIconSetting` `detail-open-icon` | `detailOpenIcon` | Defer (row open → TanStack detail route) |
| `useTextSetting` `detail-open-label` | `detailOpenLabel` | Defer |
| `useSelectSetting` padding (vertical/horizontal/filter*) | — | Drop — Tailwind page shell |
| `useSelectSetting` `row-density` | `rowDensity` | Defer |
| `useSelectSetting` `table-row-borders` / colors | — | Drop — use `rounded-md border` PLM shell |
| `useSelectSetting` `table-column-borders` / colors | — | Drop |
| `useTextSetting` record modal page/params | — | Defer — expense detail route |
| `useSelectSetting` record modal size/placement | — | Defer |
| `useTextSetting` `softr-api-key` | — | **Drop** — Supabase storage |
| `useSelectSetting` `document-click-action` | `documentClickAction` | Phase 4 |
| `useNavigationSetting` `document-click-navigation` | — | **Drop** `NavigationAction` |
| `useTextSetting` document URL params | — | Defer |
| `useBooleanSetting` `read-only-embed` | `readOnly` prop | Keep as route/embed flag |
| `useSelectSetting` `bulk-actions-enabled` | `bulkActionsEnabled` | Phase 4 |
| `useTextSetting` `bulk-record-ids-param` | — | Defer |
| `useSelectSetting` `bulk-url-sync` | — | Defer |
| `useArraySetting` `bulk-actions` | `bulkActions` | Phase 4 |
| `useTextSetting` `row-action-record-id-param` | — | Defer |
| `useArraySetting` `row-actions` | `rowActions` | Phase 4 |
| `useArraySetting` `sortable-columns` | `columns` + `columnMeta` | **Keep** (subset in v1) |
| `useArraySetting` `attribute-column-display` | `attributeColumnDisplay` | Phase 4 |
| `useArraySetting` `status-colors` | `statusColors` | **Keep** |
| `useArraySetting` `payment-type-colors` | `paymentTypeColors` | **Keep** |
| `useSelectSetting` `page-size` | `pageSize` | **Keep** |
| `useSelectSetting` `default-sort-column` | `defaultSortColumn` | **Keep** |
| `useSelectSetting` `default-sort-direction` | `defaultSortDirection` | **Keep** |
| `useSelectSetting` `default-view-mode` | `defaultViewMode` | Phase 4 (grouped/pivot) |
| `useSelectSetting` `default-group-by` | `defaultGroupBy` | Phase 4 |
| `useBooleanSetting` `show-group-sums` | `showGroupSums` | Phase 4 |
| `useSelectSetting` pivot row/col/value/agg | `pivotDefaults` | Phase 4 — drop pivot |

---

## Semantic field keys (`SB_FIELD_MAP`)

Authoritative mirror: `supabase/functions/views/domains/expense/fields.ts` + `features/.../data/field-map.ts`.

| Semantic key | Kind | MVP in Forestack |
| --- | --- | --- |
| `title` | text | ✅ editable |
| `description` | longText | Defer |
| `amount` | number | ✅ editable |
| `paid` | number | Defer |
| `direction` | enum | Display only (Phase 3+) |
| `status` | linked | ✅ combobox |
| `vendor` | linked | ✅ combobox |
| `expenseCategory` | linked | ✅ combobox |
| `expenseCategoryCode` | text | Defer (shown under title today) |
| `paymentType` | jsonb_text | Display badge (Phase 3+) |
| `department` | jsonb_text | ✅ display + filter |
| `submittedBy` | linked/jsonb | Defer (needs creator embed) |
| `invoiceDate` | jsonb_text | Defer editable date |
| `invoiceDueDate` / `invoicePaidDate` | jsonb_text | Defer |
| `submittedAt` / `createdAt` | datetime | ✅ display |
| `invoiceTags` | jsonb_arr | ✅ display chips |
| `relatedProject` | projects | ✅ display + filter |
| `attributes` | jsonb | Phase 4 tiles |
| `documents` | reverse FK | ✅ display count/icons |

---

## Cell types: MVP vs later

| Cell | Source component | MVP | Later |
| --- | --- | --- | --- |
| Title | `EditableTextCell` | ✅ `TitleCell` | — |
| Amount | `EditableCurrencyCell` | ✅ `AmountCell` | — |
| Status | `StatusComboboxCell` | ✅ `StatusCell` | Color overrides from config |
| Vendor | `SingleLinkComboboxCell` | ✅ `VendorCell` | — |
| Category | `SingleLinkComboboxCell` | ✅ `CategoryCell` | — |
| Payment type | `PaymentTypeComboboxCell` | Read-only badge | Editable |
| Department | `SingleLinkComboboxCell` (string id) | Read-only text | Free-text combobox |
| Projects | `ProjectComboboxCell` | Read-only chips | Multi-link edit |
| Tags | `InvoiceTagComboboxCell` | Read-only chips | Create tag + assign |
| Submitted by | `SubmittedByCell` | — | Avatar + name |
| Submitted / invoice date | `EditableDateCell` | `DateCell` read-only | Inline date picker |
| Direction | `DirectionCell` | — | Badge |
| Attributes | `AttributesCell` | — | Credit-card tiles + ⋯ |
| Documents | `DocumentsCell` | Icon strip | Upload + preview modals |

---

## Grouped mode complexity

**High — defer to Phase 4.**

Source grouped view (~500 lines in body + 254 in section fetchers + settings) requires:

- Per-group server queries (`useChartData` / `SectionDataFetcher`) with independent pagination
- `GROUP_FIELD_KEYS` (status, paymentType, department, category, project, tags, submittedBy)
- Group header rows with optional numeric sums (`showGroupSums`)
- Sentinel infinite-scroll rows per section
- TanStack `grouping` state coupled to filter toolbar

Forestack v1 uses **server-paginated flat list** (PLM shell). Grouped mode needs a dedicated PR with group-by query RPC or multiple parallel list queries.

---

## Keep vs drop

| Softr concept | Decision |
| --- | --- |
| `ReadOnlyContext` | **Drop** — pass `readOnly?: boolean` prop from route/parent |
| `NavigationAction` | **Drop** — TanStack `Link` / `navigate` to workspace routes |
| `SB_RUNTIME` / `useCurrentUser` | **Drop** — `useCompany()` + `requireTenantSupabase` |
| `use*Setting` hooks | **Drop** — `ExpenseTableConfig` + `default-expense-table.config.ts` |
| Softr REST (`softrApiKey`, tag/doc create) | **Drop** — Supabase tables + storage |
| `useRecords` compat shim | **Drop** — `lib/data/erp/expenses` server fns |
| iframe embed + `?filters=` URL | **Defer** — document contract; optional search-param bridge later |
| Bulk actions + URL selection sync | **Defer** Phase 4 |
| Draggable rows | **Drop** — no reorder requirement in Supabase model |
| Pivot view | **Drop** |

---

## Gap analysis vs current Forestack implementation

**Estimated UX parity (manage / flat table): ~42%** (up from ~20% before toolbar + grid rebuild).

| Area | Parity | Notes |
| --- | ---: | --- |
| Toolbar (search + Filter + Group) | ~85% | Status tabs removed; search left, Filter/Group right; status moved into Filter submenu |
| Table chrome (grid, row height, footer) | ~75% | Raw `<table>` with cell borders, checkbox + actions columns, `N rows` + page nav |
| Column headers (icon + label + sort) | ~70% | Tabler icons from `column-defs`; sort chevrons on sortable cols |
| Submitted By cell | ~65% | Avatar initials + name from `attributes.softr_submitted_by_name` |
| Status / Payment Type badges | ~70% | Config colors, rounded pills, `IconSelector` chevrons; status editable |
| Title / Amount / Category cells | ~60% | Doc icon + title; currency right-align; category plain truncated text |
| Structured filters | ~65% | Dept/category/project/tags/amount/date + status in Filter dropdown |
| Row actions ⋯ menu | ~25% | Menu shell only (View/Edit stubs) |
| Bulk selection toolbar | ~15% | Page-level checkboxes only — no bulk actions bar |
| Grouped view | 0% | Group button stub |
| Documents / attributes / tags cols | ~10% | Cells exist but not in default column set |
| Payment type edit | 0% | Read-only badge |
| Detail route / row open | 0% | No expense detail page |
| Column resize / sticky actions | ~30% | Fixed widths; actions column not sticky on horizontal scroll |

### Done (this branch)

- Softr-style toolbar inside table card: `Search expenses…` + Filter + Group
- Raw spreadsheet grid (`border-separate`, per-cell borders, ~48px rows)
- Checkbox column + local row selection state
- Header icons + sort chevrons per `sortableColumns` config
- `StatusCell` / `PaymentTypeCell` Softr badge shape (rounded rect + chevrons)
- `SubmittedByCell`, `TitleCell` doc icon, `RowActionsCell` ⋯ menu
- Status filter demoted from tabs → Filter submenu
- `ExpenseStructuredFilters` wired (dept, category, project, tags, amount, date, status)
- Server list + `toExpenseRow` for submitted_by, payment_type, category

### Missing vs Softr “right” table

| Area | Gap |
| --- | --- |
| Bulk | Selection URL sync, bulk toolbar, export/webhook actions |
| Grouped | Group-by server strategy, section headers, infinite scroll |
| Payment type | Editable `PaymentTypeComboboxCell` |
| Vendor/category | Inline link comboboxes in default column set (category is display-only today) |
| Documents | Upload/preview (Supabase storage) |
| Attributes | Credit-card tiles, uncategorized ⋯ hover |
| Detail | Row open → expense detail drawer/page; title hover Open button |
| Column resize | CSS vars `--header-{id}-size`, drag handles |
| Sticky header/actions | Full sticky thead + right-pinned actions on horizontal scroll |

---

## Phase 4+ recommended PR slices (priority for 50%+ parity)

1. **Expense detail route** — row open, title hover Open, wire View/Edit actions (~+8%)
2. **Payment type combobox** — editable badge + `PAYMENT_TYPE_CHOICES` (~+5%)
3. **Bulk actions bar** — floating toolbar on selection, select-all-matching (~+8%)
4. **Sticky actions + column resize** — Softr `--header-*-size` pattern (~+5%)
5. **Documents column** — upload, preview modal, tile strip (~+6%)
6. **Grouped view** — group-by query + section headers (~+10% but large)
7. **Tags / projects in default cols** — chips + editable comboboxes (~+4%)
8. **Submitted by embed** — `app_company_users` avatar URL when creator FK exists (~+3%)
9. **Attributes column** — credit card catalog tiles (~+4%)
10. **External embed filters** — parse `?filters=` JSON (read-only embeds)

---

## Implementation notes (this branch)

- Identity: `useCompany().companyId` — never `useTextSetting('supabase-company-id')`.
- Data: `lib/data/erp/expenses/server.ts` — not Softr `useRecords`.
- UI shell: match `plm-products-page` / `expenses-page` open table — no Card/DataTable spreadsheet regression.
- Config: `DEFAULT_EXPENSE_TABLE_CONFIG` holds Softr editor defaults that matter in-app.
