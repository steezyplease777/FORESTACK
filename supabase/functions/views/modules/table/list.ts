import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { badRequest } from "../../shared/errors.ts";

const LIST_SELECT =
  "id,company_id,domain,view_type_key,name,description,status,embed_page_id,embed_block_id,filters,display_config,created_by,created_at,updated_at,view_url";

export async function handleTableList(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const companyId = ctx.companyId;
  if (!companyId) {
    badRequest("companyId query parameter is required for list");
  }

  let qb = ctx.supabase
    .from("app_data_views")
    .select(LIST_SELECT)
    .eq("company_id", companyId)
    .eq("domain", domain.dbDomainValue)
    .order("name", { ascending: true });

  const { data, error } = await qb;
  if (error) {
    throw new Error(`List views failed: ${error.message}`);
  }

  const views = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

  const creatorIds = [
    ...new Set(
      views
        .map((v) => v.created_by)
        .filter((id) => id != null && String(id).trim() !== ""),
    ),
  ] as string[];

  const creatorMap = new Map<string, string>();
  if (creatorIds.length > 0) {
    const { data: creators } = await ctx.supabase
      .from("app_company_users")
      .select("id,org_user:app_organization_users(first_name,last_name,email)")
      .in("id", creatorIds);
    for (const row of creators ?? []) {
      const id = String(row?.id ?? "");
      if (!id) continue;
      const ou = Array.isArray(row?.org_user) ? row.org_user[0] : row?.org_user;
      const first = String(ou?.first_name ?? "").trim();
      const last = String(ou?.last_name ?? "").trim();
      const full = [first, last].filter(Boolean).join(" ");
      const label = full || String(ou?.email ?? "").trim();
      creatorMap.set(id, label ? label.toUpperCase() : "—");
    }
  }

  return {
    views: views.map((v) => ({
      ...v,
      creatorDisplayName: v.created_by
        ? creatorMap.get(String(v.created_by)) ?? "—"
        : null,
    })),
    viewTypePresets: domain.viewTypePresets ?? [],
    meta: { count: views.length },
  };
}
