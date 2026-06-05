// @ts-nocheck
import * as React from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VariantsTable } from "@/features/company/modules/plm/variants/variants-table";

import { usePlmVariants } from "@/lib/data/plm/variants/hooks";
import { totalPages } from "@/lib/data/_shared/pagination";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/variants",
);

/**
 * Flat list of every variant across the tenant. Read-only — variants
 * are derived from the style's size run and shouldn't be edited here.
 * Use the Product detail page's Variants tab for per-product context.
 */
export function PlmVariantsPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { q: qFromUrl, page, pageSize } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const [searchInput, setSearchInput] = React.useState(qFromUrl);
  React.useEffect(() => {
    setSearchInput((prev) => (prev === qFromUrl ? prev : qFromUrl));
  }, [qFromUrl]);

  const commitSearch = useDebouncedCallback(
    (next: string) => {
      navigate({
        search: (prev) => ({ ...prev, q: next, page: 1 }),
        replace: true,
      });
    },
    { wait: 250 },
  );

  const setPage = (next: number) =>
    navigate({ search: (prev) => ({ ...prev, page: next }) });

  const variantsQuery = usePlmVariants(companyId, {
    page,
    pageSize,
    q: qFromUrl,
  });

  const result = variantsQuery.data;
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pageCount = totalPages(total, pageSize);
  const isPaging = variantsQuery.isPlaceholderData;
  const isInitialLoading = variantsQuery.isLoading && !result;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Variants"
        description={
          total > 0
            ? `${total.toLocaleString()} total SKUs across all products.`
            : "Every size-level SKU in the catalog."
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {rows.length > 0 ? (
              <>
                Showing{" "}
                <span className="tabular-nums">
                  {(page - 1) * pageSize + 1}–
                  {(page - 1) * pageSize + rows.length}
                </span>{" "}
                of <span className="tabular-nums">{total.toLocaleString()}</span>
                {qFromUrl ? ` · filtered by "${qFromUrl}"` : ""}
              </>
            ) : (
              "No results"
            )}
          </p>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-56 pl-8"
              placeholder="Search SKU or UPC…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                commitSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {isInitialLoading ? (
          <TableSkeleton />
        ) : variantsQuery.error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load variants
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {variantsQuery.error instanceof Error
                ? variantsQuery.error.message
                : "Unknown error"}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No variants found"
            description={
              qFromUrl
                ? "Try a different search."
                : "Variants appear here once products are created with size-run styles."
            }
          />
        ) : (
          <VariantsTable
            rows={rows}
            basePath={basePath}
            className={isPaging ? "opacity-60 transition-opacity" : undefined}
          />
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground tabular-nums">
              Page {page} of {pageCount} · {pageSize} per page
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPaging}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount || isPaging}
                onClick={() => setPage(Math.min(pageCount, page + 1))}
              >
                Next
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-md border bg-muted/40 p-3"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-40 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
