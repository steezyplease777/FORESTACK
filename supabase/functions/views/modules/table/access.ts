import type { ViewRequestContext } from "../../shared/types.ts";
import { badRequest } from "../../shared/errors.ts";
import { parseJsonBody } from "../../shared/request.ts";
import { requireViewDataId } from "../../shared/validation.ts";

const ACCESS_TABLE = "app_data_view_access";
const EXTERNAL_ACCOUNTS_TABLE = "erp_external_accounts";
const EXTERNAL_ACCESS_TABLE = "app_data_view_external_account_access";
const VIEW_USER_ACCESS_VIEW = "app_data_view_user_access";

function toTitleCase(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapCompanyUserRow(r: Record<string, unknown>) {
  const ou = (r?.org_user ?? {}) as Record<string, unknown>;
  const co = (r?.company ?? {}) as Record<string, unknown>;
  const first = String(ou?.first_name ?? "").trim();
  const last = String(ou?.last_name ?? "").trim();
  const fullName =
    [first, last].filter(Boolean).join(" ") ||
    String(ou?.email ?? "") ||
    "Unknown user";
  return {
    id: String(r.id),
    companyId: String(r.company_id ?? ""),
    fullName,
    email: String(ou?.email ?? ""),
    companyName: String(co?.name ?? "—"),
    companyLogo: String(co?.logo_url ?? ""),
    profilePictureUrl: String(ou?.profile_picture_url ?? ""),
  };
}

export async function handleAccessCompanyMembers(ctx: ViewRequestContext) {
  const companyId = ctx.companyId;
  if (!companyId) badRequest("companyId query parameter is required");

  const { data, error } = await ctx.supabase
    .from("app_company_users")
    .select(
      "id,company_id,org_user:app_organization_users(id,first_name,last_name,email,profile_picture_url),company:app_companies(id,name,logo_url)",
    )
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Fetch members failed: ${error.message}`);

  return ((data ?? []) as Record<string, unknown>[]).map(mapCompanyUserRow);
}

/** All workspace members under the anchor company's organization, grouped by app_companies. */
export async function handleAccessOrganizationMembers(
  ctx: ViewRequestContext,
) {
  const companyId = ctx.companyId;
  if (!companyId) badRequest("companyId query parameter is required");

  const { data: anchor, error: anchorErr } = await ctx.supabase
    .from("app_companies")
    .select("organization_id")
    .eq("id", companyId)
    .maybeSingle();

  if (anchorErr) {
    throw new Error(`Resolve organization failed: ${anchorErr.message}`);
  }

  const orgId = anchor?.organization_id;
  if (!orgId) return [];

  const { data: orgCompanies, error: coErr } = await ctx.supabase
    .from("app_companies")
    .select("id")
    .eq("organization_id", orgId);

  if (coErr) {
    throw new Error(`Fetch organization companies failed: ${coErr.message}`);
  }

  const companyIds = (orgCompanies ?? [])
    .map((c) => c?.id)
    .filter(Boolean) as string[];
  if (!companyIds.length) return [];

  const { data, error } = await ctx.supabase
    .from("app_company_users")
    .select(
      "id,company_id,org_user:app_organization_users(id,first_name,last_name,email,profile_picture_url),company:app_companies(id,name,logo_url)",
    )
    .in("company_id", companyIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Fetch organization members failed: ${error.message}`);
  }

  return ((data ?? []) as Record<string, unknown>[]).map(mapCompanyUserRow);
}

export async function handleAccessCurrentMember(ctx: ViewRequestContext) {
  const companyId = ctx.companyId;
  const email = (
    ctx.searchParams.get("email") ||
    ctx.searchParams.get("userEmail") ||
    ""
  ).trim().toLowerCase();
  if (!companyId) badRequest("companyId query parameter is required");
  if (!email) badRequest("email query parameter is required");

  const { data, error } = await ctx.supabase
    .from("app_company_users")
    .select("id,org_user:app_organization_users(email)")
    .eq("company_id", companyId)
    .eq("org_user.email", email);

  if (error) return { memberId: null };
  const hit = ((data ?? []) as Record<string, unknown>[]).find((r) => {
    const ou = Array.isArray(r?.org_user) ? r.org_user[0] : r?.org_user;
    return ou && (ou as Record<string, unknown>)?.email;
  });
  return { memberId: hit?.id ? String(hit.id) : null };
}

export async function handleAccessExternalAccountsList(
  ctx: ViewRequestContext,
) {
  const companyId = ctx.companyId;
  if (!companyId) badRequest("companyId query parameter is required");

  const { data, error } = await ctx.supabase
    .from(EXTERNAL_ACCOUNTS_TABLE)
    .select(
      "id,app_company_id,crm_company_id,email,full_name,profile_picture_url,status,notes,created_at,crm_company:crm_companies(id,name,billing_email)",
    )
    .eq("app_company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(`Fetch external accounts failed: ${error.message}`);
  }
  return data ?? [];
}

export async function handleAccessExternalAccountsCreate(
  ctx: ViewRequestContext,
) {
  const body = await parseJsonBody<{
    appCompanyId?: string;
    crmCompanyId?: string | null;
    email?: string;
    fullName?: string;
    status?: string;
  }>(ctx.req);

  const appCompanyId = body.appCompanyId ?? ctx.companyId;
  if (!appCompanyId) badRequest("appCompanyId is required");

  const { data: rows, error } = await ctx.supabase
    .from(EXTERNAL_ACCOUNTS_TABLE)
    .insert({
      app_company_id: appCompanyId,
      crm_company_id: body.crmCompanyId ?? null,
      email: String(body.email ?? "").trim(),
      full_name: String(body.fullName ?? "").trim() || null,
      status: body.status || "ACTIVE",
    })
    .select();

  if (error) throw new Error(error.message || "Create external account failed");
  const row = rows?.[0];
  if (!row?.id) throw new Error("Create external account returned no id.");
  return { id: String(row.id), row };
}

export async function handleAccessCrmCompanies(ctx: ViewRequestContext) {
  const { data, error } = await ctx.supabase
    .from("crm_companies")
    .select("id,name")
    .order("name", { ascending: true });

  if (error) throw new Error(`Fetch CRM companies failed: ${error.message}`);
  return data ?? [];
}

export async function handleAccessEnriched(
  ctx: ViewRequestContext,
  viewDataId: string,
) {
  const viewId = requireViewDataId(viewDataId);

  const { data, error } = await ctx.supabase
    .from(VIEW_USER_ACCESS_VIEW)
    .select(
      "user_id,email,company_id,company_name,user_type,data_view_id,last_invited_at",
    )
    .eq("data_view_id", viewId)
    .order("user_type", { ascending: true })
    .order("email", { ascending: true });

  if (error) throw new Error(`Fetch view access failed: ${error.message}`);
  const rows = (data ?? []) as Record<string, unknown>[];
  if (!rows.length) return [];

  const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
  const { data: normUsers, error: normErr } = await ctx.supabase
    .from("app_normalized_users")
    .select(
      "user_id,user_type,first_name,last_name,email,profile_picture_url",
    )
    .in("user_id", userIds);
  if (normErr) {
    throw new Error(`Fetch user profiles failed: ${normErr.message}`);
  }

  const normMap = new Map<string, Record<string, unknown>>();
  for (const u of normUsers ?? []) {
    normMap.set(`${u.user_type}:${u.user_id}`, u as Record<string, unknown>);
  }

  const internalCompanyIds = [
    ...new Set(
      rows
        .filter((r) => r.user_type === "INTERNAL" && r.company_id)
        .map((r) => String(r.company_id)),
    ),
  ];
  const logoMap = new Map<string, string>();
  if (internalCompanyIds.length) {
    const { data: companies } = await ctx.supabase
      .from("app_companies")
      .select("id,logo_url")
      .in("id", internalCompanyIds);
    for (const c of companies ?? []) {
      if (c?.logo_url) logoMap.set(String(c.id), String(c.logo_url));
    }
  }

  return rows.map((row) => {
    const norm = normMap.get(`${row.user_type}:${row.user_id}`);
    const first = String(norm?.first_name ?? "").trim();
    const last = String(norm?.last_name ?? "").trim();
    const displayName =
      [first, last].filter(Boolean).join(" ") ||
      String(row.email || "").trim() ||
      String(row.user_id);
    const companyLogoUrl =
      row.user_type === "INTERNAL" && row.company_id
        ? logoMap.get(String(row.company_id)) || null
        : null;
    return {
      user_id: row.user_id,
      email: row.email,
      company_id: row.company_id,
      company_name: row.company_name,
      user_type: row.user_type,
      data_view_id: row.data_view_id,
      last_invited_at: row.last_invited_at,
      displayName,
      profilePictureUrl: norm?.profile_picture_url
        ? String(norm.profile_picture_url)
        : null,
      companyLogoUrl,
    };
  });
}

export async function handleAccessGrant(
  ctx: ViewRequestContext,
  viewDataId: string,
) {
  const viewId = requireViewDataId(viewDataId);
  const body = await parseJsonBody<{
    userType?: "INTERNAL" | "EXTERNAL";
    userId?: string;
  }>(ctx.req);

  const userType = body.userType;
  const userId = String(body.userId ?? "").trim();
  if (!userType || !userId) {
    badRequest("userType and userId are required");
  }

  if (userType === "INTERNAL") {
    const { data: rows, error } = await ctx.supabase
      .from(ACCESS_TABLE)
      .insert({
        view_id: viewId,
        company_user_id: userId,
        role: "VIEWER",
        is_active: true,
      })
      .select();
    if (error) throw new Error(error.message || "Grant access failed");
    const row = rows?.[0];
    if (!row?.id) throw new Error("Grant access returned no id.");
    return { id: String(row.id), row };
  }

  const { data: rows, error } = await ctx.supabase
    .from(EXTERNAL_ACCESS_TABLE)
    .insert({
      view_id: viewId,
      external_account_id: userId,
      is_active: true,
    })
    .select();
  if (error) throw new Error(error.message || "Grant access failed");
  const row = rows?.[0];
  if (!row?.id) throw new Error("Grant access returned no id.");
  return { id: String(row.id), row };
}

export async function handleAccessRevoke(
  ctx: ViewRequestContext,
  viewDataId: string,
) {
  const viewId = requireViewDataId(viewDataId);
  const body = await parseJsonBody<{
    userType?: "INTERNAL" | "EXTERNAL";
    userId?: string;
  }>(ctx.req);

  const userType = body.userType;
  const userId = String(body.userId ?? "").trim();
  if (!userType || !userId) {
    badRequest("userType and userId are required");
  }

  if (userType === "INTERNAL") {
    const { error } = await ctx.supabase
      .from(ACCESS_TABLE)
      .delete()
      .eq("view_id", viewId)
      .eq("company_user_id", userId);
    if (error) throw new Error(error.message || "Revoke access failed");
    return { userId };
  }

  const { error } = await ctx.supabase
    .from(EXTERNAL_ACCESS_TABLE)
    .delete()
    .eq("view_id", viewId)
    .eq("external_account_id", userId);
  if (error) throw new Error(error.message || "Revoke access failed");
  return { userId };
}

export async function handleAccessLastInvited(
  ctx: ViewRequestContext,
  viewDataId: string,
) {
  const viewId = requireViewDataId(viewDataId);
  const body = await parseJsonBody<{
    userType?: "INTERNAL" | "EXTERNAL";
    userId?: string;
    lastInvitedAt?: string;
  }>(ctx.req);

  const userType = body.userType;
  const userId = String(body.userId ?? "").trim();
  const lastInvitedAt = String(body.lastInvitedAt ?? "").trim();
  if (!userType || !userId || !lastInvitedAt) {
    badRequest("userType, userId, and lastInvitedAt are required");
  }

  if (userType === "INTERNAL") {
    const { error } = await ctx.supabase
      .from(ACCESS_TABLE)
      .update({ last_invited_at: lastInvitedAt })
      .eq("view_id", viewId)
      .eq("company_user_id", userId)
      .eq("is_active", true);
    if (error) {
      throw new Error(error.message || "Update invite timestamp failed");
    }
    return { userId };
  }

  const { error } = await ctx.supabase
    .from(EXTERNAL_ACCESS_TABLE)
    .update({ last_invited_at: lastInvitedAt })
    .eq("view_id", viewId)
    .eq("external_account_id", userId)
    .eq("is_active", true);
  if (error) {
    throw new Error(error.message || "Update invite timestamp failed");
  }
  return { userId };
}

export { toTitleCase };
