import type { DomainCatalogs } from "../../shared/types.ts";

const toTitleCase = (input: string): string =>
  String(input)
    .toLowerCase()
    .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));

export function mapExpenseRow(
  rec: Record<string, unknown>,
  catalogs: DomainCatalogs,
): Record<string, unknown> {
  const attrs = (rec?.attributes && typeof rec.attributes === "object")
    ? rec.attributes as Record<string, unknown>
    : {};

  const amountRaw = rec?.amount;
  const amountNum = typeof amountRaw === "number"
    ? amountRaw
    : amountRaw != null && amountRaw !== ""
    ? parseFloat(String(amountRaw))
    : NaN;

  const expenseProjects = Array.isArray(rec?.expense_projects)
    ? rec.expense_projects as Array<Record<string, unknown>>
    : [];
  const projectEntries = expenseProjects
    .map((ep) => ({
      id: String(ep?.project_id || (ep?.project as Record<string, unknown>)?.id || ""),
      label: toTitleCase(
        String((ep?.project as Record<string, unknown>)?.name || ""),
      ),
    }))
    .filter((e) => e.id);

  const tagIds: string[] = Array.isArray(rec?.tags)
    ? rec.tags.map(String)
    : [];
  const tagEntries = tagIds.map((id) => ({
    id,
    label: toTitleCase(catalogs.tagsById.get(id) || id),
  }));

  const docs = Array.isArray(rec?.documents)
    ? rec.documents as Array<Record<string, unknown>>
    : [];
  const documentLinks = docs
    .map((d) => ({ id: String(d?.id || ""), label: String(d?.name || "") }))
    .filter((d) => d.id);

  const category = rec?.category as Record<string, unknown> | undefined;
  const categoryName = String(category?.name || "");
  const categoryCode = category?.internal_code;
  const departmentStr = typeof attrs.department === "string" ? attrs.department : "";

  return {
    id: rec?.id || "",
    raw: rec,
    title: rec?.title || "",
    status: (rec?.status as Record<string, unknown>)?.name || "",
    paymentType: typeof attrs.payment_type === "string" ? attrs.payment_type : "",
    amount: Number.isFinite(amountNum) ? amountNum : null,
    submittedBy: typeof attrs.softr_submitted_by_name === "string"
      ? toTitleCase(attrs.softr_submitted_by_name)
      : "",
    submittedByAvatar: "",
    submittedAt: rec?.created_at || "",
    expenseCategory: toTitleCase(categoryName),
    expenseCategoryId: rec?.category_id || category?.id || null,
    expenseCategoryCode: typeof categoryCode === "string" && categoryCode.trim()
      ? categoryCode.trim()
      : null,
    department: toTitleCase(departmentStr),
    departmentId: departmentStr || null,
    relatedProject: projectEntries.map((e) => e.label).filter(Boolean).join(", "),
    relatedProjectIds: projectEntries.map((e) => e.id),
    relatedProjectLabels: projectEntries.map((e) => e.label),
    invoiceTagsDisplay: tagEntries.map((e) => e.label).filter(Boolean).join(", "),
    invoiceTags: tagEntries,
    invoiceDate: typeof attrs.invoice_date === "string" ? attrs.invoice_date : "",
    documentLinks,
    vendor: (rec?.vendor as Record<string, unknown>)?.name || "",
    vendorId: rec?.vendor_id || (rec?.vendor as Record<string, unknown>)?.id || null,
    statusId: rec?.status_id || (rec?.status as Record<string, unknown>)?.id || null,
    expenseAssignment: typeof attrs.softr_assignment === "string"
      ? attrs.softr_assignment
      : "",
    invoicePaidDate: typeof attrs.invoice_paid_date === "string"
      ? attrs.invoice_paid_date
      : "",
    createdAt: rec?.created_at || "",
  };
}
