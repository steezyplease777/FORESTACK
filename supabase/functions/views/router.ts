import { Hono } from "hono";
import { cors } from "hono/cors";
import { HttpError } from "./shared/errors.ts";
import { createSupabaseFromRequest } from "./shared/supabase.ts";
import type { UtilityRequestContext, ViewRequestContext } from "./shared/types.ts";
import {
  parsePositiveInt,
  resolveAction,
  resolveDomainSlug,
  resolveUtility,
  resolveViewType,
  requireViewDataId,
} from "./shared/validation.ts";
import { getViewModule } from "./modules/index.ts";
import {
  handleAccessCompanyMembers,
  handleAccessCrmCompanies,
  handleAccessCurrentMember,
  handleAccessEnriched,
  handleAccessExternalAccountsCreate,
  handleAccessExternalAccountsList,
  handleAccessGrant,
  handleAccessLastInvited,
  handleAccessRevoke,
  handleAccessOrganizationMembers,
} from "./modules/table/access.ts";

function viewContext(
  base: ReturnType<typeof baseContext>,
  action: ViewRequestContext["action"],
  viewDataId: string | null = base.viewDataId,
): ViewRequestContext {
  return {
    supabase: base.supabase,
    req: base.req,
    dataDomainId: base.dataDomainId,
    domainKey: base.domainKey,
    viewType: base.viewType,
    action,
    viewDataId,
    companyId: base.companyId,
    page: base.page,
    pageSize: base.pageSize,
    searchParams: base.searchParams,
  };
}

function errorResponse(c: any, err: unknown) {
  if (err instanceof HttpError) {
    return c.json({ error: err.message, details: err.details }, err.status);
  }
  console.error(err);
  return c.json({
    error: err instanceof Error ? err.message : "Internal server error",
  }, 500);
}

function baseContext(c: {
  req: { raw: Request; param: (k: string) => string; url: string };
}) {
  const supabase = createSupabaseFromRequest(c.req.raw);
  const dataDomainId = c.req.param("dataDomainId");
  const viewTypeParam = c.req.param("viewType");
  const domain = resolveDomainSlug(dataDomainId);
  const viewType = resolveViewType(viewTypeParam);
  const searchParams = new URL(c.req.url).searchParams;

  const viewDataIdParam = c.req.param("viewDataId");
  const viewDataId = viewDataIdParam
    ? viewDataIdParam
    : searchParams.get("viewDataId") ||
      searchParams.get("viewId") ||
      searchParams.get("view_id");

  return {
    supabase,
    req: c.req.raw,
    dataDomainId,
    domainKey: domain.key,
    viewType,
    viewDataId,
    companyId: searchParams.get("companyId") || searchParams.get("company_id"),
    page: parsePositiveInt(searchParams.get("page"), 0),
    pageSize: parsePositiveInt(
      searchParams.get("pageSize") ?? searchParams.get("page_size"),
      100,
      500,
    ),
    searchParams,
    domain,
  };
}

const api = new Hono();

api.use("*", cors({
  origin: "*",
  allowHeaders: ["authorization", "x-client-info", "apikey", "content-type"],
}));

api.get("/health", (c) => c.json({ ok: true, service: "views" }));

api.all("/:dataDomainId/:viewType/utilities/:utility", async (c) => {
  try {
    const base = baseContext(c);
    const utility = resolveUtility(c.req.param("utility"));
    const module = getViewModule(base.viewType)!;
    const handler = module.handlers.utility;
    if (!handler) {
      return c.json({
        error: `Utilities not supported for view type: ${base.viewType}`,
      }, 400);
    }
    const ctx: UtilityRequestContext = {
      supabase: base.supabase,
      req: base.req,
      dataDomainId: base.dataDomainId,
      domainKey: base.domainKey,
      viewType: base.viewType,
      viewDataId: base.viewDataId,
      companyId: base.companyId,
      page: base.page,
      pageSize: base.pageSize,
      searchParams: base.searchParams,
      utility,
    };
    const result = await handler(ctx, base.domain);
    return c.json(result as Record<string, unknown>);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/list", async (c) => {
  try {
    const base = baseContext(c);
    const module = getViewModule(base.viewType)!;
    const handler = module.handlers.list;
    if (!handler) {
      return c.json({ error: "List action not supported for this view type" }, 400);
    }
    const ctx: ViewRequestContext = {
      supabase: base.supabase,
      req: base.req,
      dataDomainId: base.dataDomainId,
      domainKey: base.domainKey,
      viewType: base.viewType,
      action: "list",
      viewDataId: null,
      companyId: base.companyId,
      page: base.page,
      pageSize: base.pageSize,
      searchParams: base.searchParams,
    };
    const result = await handler(ctx, base.domain);
    return c.json(result as Record<string, unknown>);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/create", async (c) => {
  try {
    const base = baseContext(c);
    const module = getViewModule(base.viewType)!;
    const handler = module.handlers.create;
    if (!handler) {
      return c.json({ error: "Create action not supported for this view type" }, 400);
    }
    const ctx: ViewRequestContext = {
      supabase: base.supabase,
      req: base.req,
      dataDomainId: base.dataDomainId,
      domainKey: base.domainKey,
      viewType: base.viewType,
      action: "create",
      viewDataId: null,
      companyId: base.companyId,
      page: base.page,
      pageSize: base.pageSize,
      searchParams: base.searchParams,
    };
    const result = await handler(ctx, base.domain);
    return c.json(result as Record<string, unknown>, 201);
  } catch (err) {
    return errorResponse(c, err);
  }
});

// ── Access (view grants, members, external accounts) ───────────────────
api.all("/:dataDomainId/:viewType/access/company-members", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const result = await handleAccessCompanyMembers(viewContext(base, "view"));
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/organization-members", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const result = await handleAccessOrganizationMembers(
      viewContext(base, "view"),
    );
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/current-member", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const result = await handleAccessCurrentMember(viewContext(base, "view"));
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/crm-companies", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const result = await handleAccessCrmCompanies(viewContext(base, "view"));
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/external-accounts", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const ctx = viewContext(base, "view");
    if (c.req.method === "POST") {
      const result = await handleAccessExternalAccountsCreate(ctx);
      return c.json(result, 201);
    }
    const result = await handleAccessExternalAccountsList(ctx);
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/:viewDataId/enriched", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const viewDataId = requireViewDataId(base.viewDataId);
    const result = await handleAccessEnriched(
      viewContext(base, "view", viewDataId),
      viewDataId,
    );
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/:viewDataId/grant", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const viewDataId = requireViewDataId(base.viewDataId);
    const result = await handleAccessGrant(
      viewContext(base, "update", viewDataId),
      viewDataId,
    );
    return c.json(result, 201);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/:viewDataId/revoke", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const viewDataId = requireViewDataId(base.viewDataId);
    const result = await handleAccessRevoke(
      viewContext(base, "update", viewDataId),
      viewDataId,
    );
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/access/:viewDataId/last-invited", async (c) => {
  try {
    const base = baseContext(c);
    resolveViewType(base.viewType);
    const viewDataId = requireViewDataId(base.viewDataId);
    const result = await handleAccessLastInvited(
      viewContext(base, "update", viewDataId),
      viewDataId,
    );
    return c.json(result);
  } catch (err) {
    return errorResponse(c, err);
  }
});

api.all("/:dataDomainId/:viewType/:action/:viewDataId", async (c) => {
  try {
    const base = baseContext(c);
    const action = resolveAction(c.req.param("action"));
    if (action === "create" || action === "list") {
      return c.json({
        error: `Use /:dataDomainId/:viewType/${action} (no viewDataId in path)`,
      }, 400);
    }
    const viewDataId = requireViewDataId(base.viewDataId);
    const module = getViewModule(base.viewType)!;
    const handler = module.handlers[action];
    if (!handler) {
      return c.json({ error: `Action not supported: ${action}` }, 400);
    }
    const ctx: ViewRequestContext = {
      supabase: base.supabase,
      req: base.req,
      dataDomainId: base.dataDomainId,
      domainKey: base.domainKey,
      viewType: base.viewType,
      action,
      viewDataId,
      companyId: base.companyId,
      page: base.page,
      pageSize: base.pageSize,
      searchParams: base.searchParams,
    };
    const result = await handler(ctx, base.domain);
    return c.json(result as Record<string, unknown>);
  } catch (err) {
    return errorResponse(c, err);
  }
});

/** Strip a leading `/views` segment when the gateway includes it. */
function normalizeRequest(req: Request): Request {
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.startsWith("/views/") || path === "/views") {
    url.pathname = path === "/views" ? "/" : path.slice("/views".length);
    return new Request(url.toString(), req);
  }
  return req;
}

const app = new Hono();
app.all("*", (c) => api.fetch(normalizeRequest(c.req.raw)));

export { app };
export default app;
