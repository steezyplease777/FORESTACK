import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { notFound } from "../../shared/errors.ts";
import { loadViewRecord } from "../../shared/supabase.ts";
import {
  assertViewDomainMatch,
  requireViewDataId,
  viewTypeMatchesRecord,
} from "../../shared/validation.ts";
import { badRequest } from "../../shared/errors.ts";

export async function handleTableDelete(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
) {
  const viewDataId = requireViewDataId(ctx.viewDataId);

  const existing = await loadViewRecord(ctx.supabase, viewDataId);
  if (!existing) notFound(`View not found: ${viewDataId}`);
  assertViewDomainMatch(existing.domain, domain.key, domain.dbDomainValue);
  if (
    !viewTypeMatchesRecord(
      ctx.viewType,
      existing.view_type_key,
      existing.display_config,
    )
  ) {
    badRequest(
      `View type "${ctx.viewType}" does not match view record type "${existing.view_type_key}"`,
    );
  }

  const { error } = await ctx.supabase
    .from("app_data_views")
    .delete()
    .eq("id", viewDataId);

  if (error) {
    throw new Error(`Delete view failed: ${error.message}`);
  }

  return { id: viewDataId, deleted: true };
}
