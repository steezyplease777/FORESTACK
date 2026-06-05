import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { badRequest, notFound } from "../../shared/errors.ts";
import { loadViewRecord } from "../../shared/supabase.ts";
import { parseJsonBody } from "../../shared/request.ts";
import {
  assertViewDomainMatch,
  requireViewDataId,
  viewTypeMatchesRecord,
} from "../../shared/validation.ts";
import { buildRendererContext } from "./renderer-response.ts";
import { getViewModule } from "../index.ts";

export type UpdateViewBody = {
  name?: string;
  description?: string;
  status?: string;
  view_type_key?: string;
  embed_page_id?: string | null;
  embed_block_id?: string | null;
  display_config?: Record<string, unknown> | null;
  filters?: unknown[] | null;
};

export async function handleTableUpdate(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const viewDataId = requireViewDataId(ctx.viewDataId);
  const body = await parseJsonBody<UpdateViewBody>(ctx.req);

  const existing = await loadViewRecord(ctx.supabase, viewDataId);
  if (!existing) notFound(`View not found: ${viewDataId}`);
  assertViewDomainMatch(existing.domain, domain.key, domain.dbDomainValue);
  if (!viewTypeMatchesRecord(
      ctx.viewType,
      existing.view_type_key,
      existing.display_config,
    )
  ) {
    badRequest(
      `View type "${ctx.viewType}" does not match view record type "${existing.view_type_key}"`,
    );
  }

  const mod = getViewModule(ctx.viewType)!;

  const patch: Record<string, unknown> = {};
  if (body.name != null) patch.name = String(body.name).trim();
  if (body.description != null) patch.description = String(body.description);
  if (body.status != null) {
    patch.status = String(body.status).trim().toUpperCase();
  }
  if (body.view_type_key != null) {
    const next = String(body.view_type_key).trim();
    if (next !== String(existing.view_type_key ?? "").trim()) {
      badRequest("view_type_key cannot be changed after the view is created");
    }
  }
  if (body.embed_page_id !== undefined) patch.embed_page_id = body.embed_page_id;
  if (body.embed_block_id !== undefined) {
    patch.embed_block_id = body.embed_block_id;
  }
  if (body.display_config !== undefined) {
    patch.display_config = mod.resolveDisplayConfig(body.display_config);
  }
  if (body.filters !== undefined) patch.filters = body.filters;

  if (Object.keys(patch).length === 0) {
    badRequest("No updatable fields provided");
  }

  const { data: rows, error } = await ctx.supabase
    .from("app_data_views")
    .update(patch)
    .eq("id", viewDataId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Update view failed: ${error.message}`);
  }
  if (!rows) notFound(`View not found after update: ${viewDataId}`);

  const view = rows as Record<string, unknown>;
  const rendererContext = buildRendererContext(
    ctx.viewType,
    domain,
    view.display_config as Record<string, unknown> | null,
  );

  return {
    view: {
      id: view.id,
      name: view.name,
      description: view.description,
      domain: view.domain,
      view_type_key: view.view_type_key,
      status: view.status,
      embed_page_id: view.embed_page_id,
      embed_block_id: view.embed_block_id,
      display_config: view.display_config,
      filters: view.filters,
      view_url: view.view_url,
      company_id: view.company_id,
      created_by: view.created_by,
      created_at: view.created_at,
      updated_at: view.updated_at,
    },
    ...rendererContext,
  };
}
