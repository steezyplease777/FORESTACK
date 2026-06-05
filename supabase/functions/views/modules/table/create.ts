import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { badRequest } from "../../shared/errors.ts";
import { parseJsonBody } from "../../shared/request.ts";
import { getViewModule } from "../index.ts";
import { buildRendererContext } from "./renderer-response.ts";

export interface CreateViewBody {
  name?: string;
  description?: string;
  status?: string;
  companyId?: string;
  viewTypeKey?: string;
  embedPageId?: string;
  embedBlockId?: string;
  createdBy?: string;
}

export async function handleTableCreate(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const body = await parseJsonBody<CreateViewBody>(ctx.req);
  const companyId = body.companyId ?? ctx.companyId;
  if (!companyId) {
    badRequest("companyId is required (body or query param)");
  }

  const name = String(body.name ?? "").trim() || "Untitled view";
  const status = String(body.status ?? "DRAFT").trim().toUpperCase() || "DRAFT";
  const viewTypeKey = String(body.viewTypeKey ?? `${domain.key}-${ctx.viewType}`).trim();

  const mod = getViewModule(ctx.viewType)!;
  const displayConfig = mod.getDefaultDisplayConfig(domain);

  const { data: rows, error } = await ctx.supabase
    .from("app_data_views")
    .insert({
      company_id: companyId,
      domain: domain.dbDomainValue,
      view_type_key: viewTypeKey,
      embed_page_id: body.embedPageId ?? null,
      embed_block_id: body.embedBlockId ?? null,
      name,
      description: body.description ?? "",
      status,
      display_config: displayConfig,
      created_by: body.createdBy ?? null,
    })
    .select("id,name,domain,view_type_key,status,display_config,view_url,company_id");

  if (error) {
    throw new Error(`Create view failed: ${error.message}`);
  }

  const view = rows?.[0];
  if (!view?.id) {
    throw new Error("Create view returned no id");
  }

  const rendererContext = buildRendererContext(
    ctx.viewType,
    domain,
    displayConfig,
  );

  return {
    view: {
      id: view.id,
      name: view.name,
      domain: view.domain,
      view_type_key: view.view_type_key,
      status: view.status,
      view_url: view.view_url,
      company_id: view.company_id,
    },
    ...rendererContext,
  };
}
