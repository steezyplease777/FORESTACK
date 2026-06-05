import type { DomainFieldDefinition, DomainFieldMeta } from "../../shared/types.ts";

export const EXPENSE_TABLE = "erp_expenses";
export const EXPENSE_STATUSES = "erp_expense_statuses";
export const EXPENSE_VENDORS = "erp_vendors";
export const EXPENSE_CATEGORIES = "erp_expense_categories";
export const EXPENSE_TAGS = "erp_expense_tags";
export const EXPENSE_PROJECTS = "pm_projects";
export const EXPENSE_PROJECTS_JUNCTION = "erp_expense_projects";
export const EXPENSE_DOCUMENTS = "erp_expense_documents";

export const EXPENSE_FIELD_MAP: Record<string, DomainFieldMeta> = {
  title: {
    kind: "text",
    selectFragment: "title",
    filterColumn: "title",
    sortColumn: "title",
    groupable: false,
  },
  description: {
    kind: "longText",
    selectFragment: "description",
    filterColumn: "description",
    sortColumn: "description",
    groupable: false,
  },
  amount: {
    kind: "number",
    selectFragment: "amount",
    filterColumn: "amount",
    sortColumn: "amount",
    groupable: false,
  },
  paid: {
    kind: "number",
    selectFragment: "paid",
    filterColumn: "paid",
    sortColumn: "paid",
    groupable: false,
  },
  direction: {
    kind: "enum",
    selectFragment: "direction",
    filterColumn: "direction",
    sortColumn: "direction",
    groupable: true,
    groupTokenMode: "label",
  },
  status: {
    kind: "linked",
    selectFragment: "status:erp_expense_statuses(id,name,color)",
    filterColumn: "status.name",
    sortColumn: "status(name)",
    fkColumn: "status_id",
    innerJoinRelation: "status:erp_expense_statuses",
    optionsTable: EXPENSE_STATUSES,
    optionsExtra: ["color"],
    groupable: true,
    groupTokenMode: "label",
  },
  vendor: {
    kind: "linked",
    selectFragment: "vendor:erp_vendors(id,name)",
    filterColumn: "vendor.name",
    sortColumn: "vendor(name)",
    fkColumn: "vendor_id",
    innerJoinRelation: "vendor:erp_vendors",
    optionsTable: EXPENSE_VENDORS,
    groupable: true,
    groupTokenMode: "label",
  },
  expenseCategory: {
    kind: "linked",
    selectFragment: "category:erp_expense_categories(id,name,internal_code)",
    filterColumn: "category.name",
    sortColumn: "category(name)",
    fkColumn: "category_id",
    innerJoinRelation: "category:erp_expense_categories",
    optionsTable: EXPENSE_CATEGORIES,
    optionsExtra: ["internal_code"],
    groupable: true,
    groupTokenMode: "label",
  },
  expenseCategoryCode: {
    kind: "text",
    filterColumn: "category.internal_code",
    groupable: false,
  },
  paymentType: {
    kind: "jsonb_text",
    filterColumn: "attributes->>payment_type",
    sortColumn: "attributes->>payment_type",
    attributeKey: "payment_type",
    groupable: true,
    groupTokenMode: "label",
  },
  department: {
    kind: "jsonb_text",
    filterColumn: "attributes->>department",
    sortColumn: "attributes->>department",
    attributeKey: "department",
    groupable: true,
    groupTokenMode: "label",
  },
  submittedBy: {
    kind: "jsonb_text",
    filterColumn: "attributes->>softr_submitted_by_name",
    sortColumn: "attributes->>softr_submitted_by_name",
    attributeKey: "softr_submitted_by_name",
    groupable: true,
    groupTokenMode: "label",
  },
  expenseAssignment: {
    kind: "jsonb_text",
    filterColumn: "attributes->>softr_assignment",
    sortColumn: "attributes->>softr_assignment",
    attributeKey: "softr_assignment",
    groupable: true,
    groupTokenMode: "label",
  },
  invoiceDate: {
    kind: "jsonb_text",
    filterColumn: "attributes->>invoice_date",
    sortColumn: "attributes->>invoice_date",
    attributeKey: "invoice_date",
    groupable: false,
  },
  invoiceDueDate: {
    kind: "jsonb_text",
    filterColumn: "attributes->>invoice_date",
    sortColumn: "attributes->>invoice_date",
    attributeKey: "invoice_date",
    groupable: false,
  },
  invoicePaidDate: {
    kind: "jsonb_text",
    filterColumn: "attributes->>invoice_paid_date",
    sortColumn: "attributes->>invoice_paid_date",
    attributeKey: "invoice_paid_date",
    groupable: false,
  },
  submittedAt: {
    kind: "datetime",
    selectFragment: "created_at",
    filterColumn: "created_at",
    sortColumn: "created_at",
    groupable: false,
  },
  createdAt: {
    kind: "datetime",
    selectFragment: "created_at",
    filterColumn: "created_at",
    sortColumn: "created_at",
    groupable: false,
  },
  invoiceTags: {
    kind: "jsonb_arr",
    selectFragment: "tags",
    filterColumn: "tags",
    optionsTable: EXPENSE_TAGS,
    groupable: true,
    groupTokenMode: "id",
  },
  relatedProject: {
    kind: "projects",
    selectFragment:
      "expense_projects:erp_expense_projects(project_id,project:pm_projects(id,name,project_code))",
    filterColumn: "expense_projects.project_id",
    innerJoinRelation: "expense_projects:erp_expense_projects",
    optionsTable: EXPENSE_PROJECTS,
    optionsExtra: ["project_code"],
    groupable: true,
    groupTokenMode: "label",
  },
  documents: {
    kind: "documents",
    selectFragment:
      "documents:erp_expense_documents(id,name,extension,file_path,type_id,created_at)",
    filterColumn: "documents.id",
    groupable: false,
  },
};

/** Fields allowed as group-by targets in grouped views (explicit domain config). */
export const EXPENSE_GROUPABLE_FIELD_IDS = Object.entries(EXPENSE_FIELD_MAP)
  .filter(([, meta]) => meta.groupable === true)
  .map(([id]) => id);

const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  description: "Description",
  amount: "Amount",
  paid: "Paid",
  direction: "Direction",
  status: "Status",
  vendor: "Vendor",
  expenseCategory: "Category",
  expenseCategoryCode: "Category Code",
  paymentType: "Payment Type",
  department: "Department",
  submittedBy: "Submitted By",
  expenseAssignment: "Expense Assignment",
  invoiceDate: "Invoice Date",
  invoiceDueDate: "Invoice Due Date",
  invoicePaidDate: "Invoice Paid Date",
  submittedAt: "Submitted At",
  createdAt: "Submitted At",
  invoiceTags: "Tags",
  relatedProject: "Project",
  documents: "Documents",
};

export const EXPENSE_FILTER_FIELD_ALIASES: Record<string, string> = {
  createdAt: "createdAt",
  submittedAt: "createdAt",
  relatedProject: "relatedProject",
  project: "relatedProject",
  tags: "invoiceTags",
  invoiceTags: "invoiceTags",
  category: "expenseCategory",
};

export function buildExpenseFieldDefinitions(): DomainFieldDefinition[] {
  return Object.entries(EXPENSE_FIELD_MAP).map(([id, meta]) => ({
    id,
    label: FIELD_LABELS[id] ?? id,
    kind: meta.kind,
    filterable: meta.kind !== "documents",
    sortable: !!meta.sortColumn,
    groupable: meta.groupable === true,
    groupTokenMode: meta.groupTokenMode,
    aggregatable: meta.kind === "number",
    relationship: meta.optionsTable
      ? {
        table: meta.optionsTable,
        displayColumn: "name",
        fkColumn: meta.fkColumn,
      }
      : undefined,
  }));
}

export function buildExpenseSelect(
  fieldIds: Set<string>,
  innerJoins: Set<string>,
): string {
  const base = [
    "id",
    "company_id",
    "softr_id",
    "created_at",
    "status_id",
    "vendor_id",
    "category_id",
    "attributes",
    "tags",
    "title",
    "amount",
  ];
  const frags = new Set<string>(base);

  for (const fieldId of fieldIds) {
    const meta = EXPENSE_FIELD_MAP[fieldId];
    if (meta?.selectFragment) frags.add(meta.selectFragment);
  }

  if (fieldIds.has("documents") || fieldIds.size === 0) {
    frags.add(EXPENSE_FIELD_MAP.documents.selectFragment!);
  }

  for (const rel of innerJoins) {
    for (const meta of Object.values(EXPENSE_FIELD_MAP)) {
      if (meta.innerJoinRelation === rel && meta.selectFragment) {
        frags.add(meta.selectFragment);
      }
    }
  }

  return Array.from(frags)
    .map((frag) => {
      const relationKey = frag.split("(")[0];
      if (innerJoins.has(relationKey)) {
        return frag.replace(/^([a-z_]+:[a-z_]+)\(/i, "$1!inner(");
      }
      return frag;
    })
    .join(",");
}
