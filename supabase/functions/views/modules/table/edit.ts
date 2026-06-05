import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { badRequest, notFound } from "../../shared/errors.ts";
import { loadViewRecord } from "../../shared/supabase.ts";
import {
  assertViewDomainMatch,
  requireViewDataId,
  viewTypeMatchesRecord,
} from "../../shared/validation.ts";
import { buildRendererContext } from "./renderer-response.ts";
import { getViewModule } from "../index.ts";

export async function handleTableEdit(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const viewDataId = requireViewDataId(ctx.viewDataId);

  const view = await loadViewRecord(ctx.supabase, viewDataId);
  if (!view) notFound(`View not found: ${viewDataId}`);
  assertViewDomainMatch(view.domain, domain.key, domain.dbDomainValue);
  if (
    !viewTypeMatchesRecord(ctx.viewType, view.view_type_key, view.display_config)
  ) {
    badRequest(
      `View type "${ctx.viewType}" does not match view record type "${view.view_type_key}"`,
    );
  }

  const mod = getViewModule(ctx.viewType)!;
  const displayConfig = mod.resolveDisplayConfig(view.display_config);
  const rendererContext = buildRendererContext(
    ctx.viewType,
    domain,
    view.display_config,
  );

  const filterValueFields = new Set<string>();
  for (const f of displayConfig.fields ?? []) {
    for (const _flt of f.filters ?? []) {
      filterValueFields.add(f.fieldId);
    }
  }
  for (const r of view.filters ?? displayConfig.filters ?? []) {
    if (r?.field) filterValueFields.add(String(r.field));
  }

  const filterValues: Record<string, Array<{ id: string; label: string }>> = {};
  for (const fieldId of filterValueFields) {
    filterValues[fieldId] = await domain.fetchDistinctFilterValues(
      { ...ctx, utility: "filter-values" },
      fieldId,
    );
  }

  let creator: Record<string, unknown> | null = null;
  if (view.created_by) {
    const { data: creatorRow, error: creatorError } = await ctx.supabase
      .from("app_company_users")
      .select(
        "id,org_user:app_organization_users(first_name,last_name,email,profile_picture_url)",
      )
      .eq("id", view.created_by)
      .maybeSingle();
    if (!creatorError && creatorRow) {
      creator = creatorRow as Record<string, unknown>;
    }
  }

  return {
    view: {
      id: view.id,
      name: view.name,
      description: view.description,
      domain: view.domain,
      view_type_key: view.view_type_key,
      status: view.status,
      view_url: view.view_url,
      embed_page_id: view.embed_page_id,
      embed_block_id: view.embed_block_id,
      display_config: view.display_config,
      filters: view.filters,
      created_by: view.created_by,
      creator,
    },
    ...rendererContext,
    utilities: {
      ...rendererContext.utilities,
      filterValues,
    },
  };
}
