import type { ViewRequestContext } from "../../shared/types.ts";
import { EXPENSE_DOCUMENTS } from "./fields.ts";

const DOCUMENTS_BUCKET = "erp-expense-documents";
const DOCUMENT_TYPES_TABLE = "erp_expense_documents_types";

export type DocumentTypeRow = { id: string; label: string };

export async function fetchExpenseDocumentTypes(
  ctx: ViewRequestContext,
): Promise<DocumentTypeRow[]> {
  const companyId = ctx.companyId;
  let qb = ctx.supabase
    .from(DOCUMENT_TYPES_TABLE)
    .select("id,name")
    .order("name", { ascending: true })
    .limit(500);
  if (companyId) qb = qb.eq("company_id", companyId);
  const { data, error } = await qb;
  if (error) throw new Error(`Document types fetch failed: ${error.message}`);
  return (data ?? []).map((r: { id: string; name?: string }) => ({
    id: String(r.id),
    label: String(r.name ?? r.id),
  }));
}

export type DocumentMapEntry = {
  id: string;
  title: string;
  files: Array<{ url: string; name: string; mime: string; thumb: string }>;
  documentTypeId?: string;
  documentTypeLabel?: string;
  createdAt?: string;
};

function extFromName(name: string, mime: string): string {
  const dot = name.lastIndexOf(".");
  if (dot >= 0 && dot < name.length - 1) {
    return name.slice(dot + 1).toLowerCase();
  }
  const m: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
    "text/csv": "csv",
  };
  return m[mime] || "";
}

/** Document id → files map for the documents cell (signed URLs included). */
export async function fetchExpenseDocumentsMap(
  ctx: ViewRequestContext,
): Promise<Record<string, DocumentMapEntry>> {
  const companyId = ctx.companyId;
  let qb = ctx.supabase
    .from(EXPENSE_DOCUMENTS)
    .select(
      "id,name,extension,file_path,company_id,type_id,created_at,expense_id,type:erp_expense_documents_types(id,name)",
    )
    .order("created_at", { ascending: false })
    .limit(10000);
  if (companyId) qb = qb.eq("company_id", companyId);
  const { data: docRows, error } = await qb;
  if (error) {
    throw new Error(`Expense documents fetch failed: ${error.message}`);
  }
  const rows = docRows ?? [];

  type Pending = {
    id: string;
    name: string;
    mime: string;
    path: string;
    directUrl: string;
    typeId?: string;
    typeLabel?: string;
    createdAt?: string;
  };
  const pending: Pending[] = [];
  const pathsToSign: string[] = [];

  for (const rec of rows) {
    const id = rec?.id;
    if (!id) continue;
    const name = typeof rec?.name === "string" ? rec.name : "";
    const mime = typeof rec?.extension === "string" ? rec.extension : "";
    const filePath = typeof rec?.file_path === "string" ? rec.file_path : "";
    const directUrl = /^https?:\/\//i.test(filePath) ? filePath : "";

    let path = "";
    if (!directUrl) {
      if (filePath && !/^https?:\/\//i.test(filePath)) {
        path = filePath.replace(/^\/+/, "");
      } else if (rec?.company_id && rec?.expense_id && rec?.type_id) {
        const ext = extFromName(name, mime);
        path = `${rec.company_id}/${rec.expense_id}/${rec.type_id}/${id}${ext ? `.${ext}` : ""}`;
      }
      if (path) pathsToSign.push(path);
    }

    pending.push({
      id: String(id),
      name,
      mime,
      path,
      directUrl,
      typeId: rec?.type_id || undefined,
      typeLabel: rec?.type?.name || undefined,
      createdAt: rec?.created_at || undefined,
    });
  }

  const signedByPath = new Map<string, string>();
  if (pathsToSign.length > 0) {
    try {
      const { data: signed } = await ctx.supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrls(pathsToSign, 3600);
      for (const s of signed || []) {
        if (!s?.path || s?.error) continue;
        const full = s?.signedUrl || (s as { signedURL?: string }).signedURL || "";
        if (full) signedByPath.set(String(s.path).replace(/^\/+/, ""), full);
      }
    } catch {
      // fall back to filename-only tiles
    }
  }

  const out: Record<string, DocumentMapEntry> = {};

  for (const p of pending) {
    const url = p.directUrl || (p.path ? signedByPath.get(p.path) || "" : "");
    const isImage = p.mime.startsWith("image/");
    const files = url
      ? [{ url, name: p.name, mime: p.mime, thumb: isImage ? url : "" }]
      : [];

    out[p.id] = {
      id: p.id,
      title: p.name || p.id,
      files,
      documentTypeId: p.typeId,
      documentTypeLabel: p.typeLabel,
      createdAt: p.createdAt,
    };
  }

  return out;
}
