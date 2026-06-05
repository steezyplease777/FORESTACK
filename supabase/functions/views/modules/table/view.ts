import type { DataDomainModule, ViewRequestContext } from "../../shared/types.ts";
import { resolveTableViewQuery } from "./view-query.ts";

export type TableViewRowsPayload = {
  rows: Record<string, unknown>[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number | null;
    hasMore: boolean;
  };
  displayConfig: import("../../shared/types.ts").TableDisplayConfig;
};

/** Paginated rows only — config comes from the `edit` action on the client. */
export async function fetchTableViewRows(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
): Promise<TableViewRowsPayload> {
  const resolved = await resolveTableViewQuery(ctx, domain);
  const page = ctx.page;
  const pageSize = ctx.pageSize;
  const offset = page * pageSize;

  const catalogs = await domain.loadCatalogs(
    ctx,
    Array.from(resolved.fieldIds),
  );

  const { rows: rawRows, totalCount } = await domain.fetchRecords(ctx, {
    view: resolved.view,
    displayConfig: resolved.displayConfig,
    fieldIds: resolved.fieldIds,
    where: resolved.where,
    orderBy: resolved.orderBy,
    offset,
    limit: pageSize,
  });

  const rows = rawRows.map((raw) => domain.mapRow(raw, catalogs));

  return {
    rows,
    meta: {
      page,
      pageSize,
      totalCount,
      hasMore: totalCount != null
        ? offset + rows.length < totalCount
        : rows.length >= pageSize,
    },
    displayConfig: resolved.displayConfig,
  };
}

export async function handleTableView(
  ctx: ViewRequestContext,
  domain: DataDomainModule,
): Promise<Pick<TableViewRowsPayload, "rows" | "meta">> {
  const { rows, meta } = await fetchTableViewRows(ctx, domain);
  return { rows, meta };
}
