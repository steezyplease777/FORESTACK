// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCube,
  IconDotsVertical,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

import {
  useDeletePlmProduct,
  usePlmProducts,
} from "@/lib/data/plm/products/hooks";
import type { ProductListRow } from "@/lib/data/plm/products/client";
import { totalPages } from "@/lib/data/_shared/pagination";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/products/",
);

/**
 * PLM Products list.
 *
 * Mirrors the Campaigns list pattern exactly — pagination + search
 * state lives in the URL (so refresh / back / share all work),
 * queryKey is scoped by (page, pageSize, q) and `keepPreviousData`
 * keeps the table steady while the next page loads. Row actions
 * (edit/delete) live in a dropdown; the edit target opens the detail
 * page in place of a modal because the form is too big for a dialog.
 */
export function PlmProductsPage() {
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

  const productsQuery = usePlmProducts(companyId, {
    page,
    pageSize,
    q: qFromUrl,
  });
  const deleteProduct = useDeletePlmProduct(companyId, companySlug);

  const newProductHref = `${basePath}/plm/products/new`;
  const [deleteTarget, setDeleteTarget] = React.useState<ProductListRow | null>(
    null,
  );

  const result = productsQuery.data;
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pageCount = totalPages(total, pageSize);
  const isPaging = productsQuery.isPlaceholderData;
  const isInitialLoading = productsQuery.isLoading && !result;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Products"
        description={
          total > 0
            ? `${total.toLocaleString()} total — master product records with style, variants, and sourcing.`
            : "Master product records with style, variants, and sourcing."
        }
        actions={
          <Button size="sm" asChild>
            <Link to={newProductHref}>
              <IconPlus className="size-4" />
              New product
            </Link>
          </Button>
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
              className="h-8 w-64 pl-8"
              placeholder="Search name or internal code…"
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
        ) : productsQuery.error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load products
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {productsQuery.error instanceof Error
                ? productsQuery.error.message
                : "Unknown error"}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No products found"
            description={
              qFromUrl
                ? "Try a different search."
                : "Create your first product to start building out a catalog."
            }
            actionLabel={!qFromUrl ? "New product" : undefined}
            onAction={
              !qFromUrl ? () => navigate({ to: newProductHref }) : undefined
            }
          />
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-md border",
              isPaging ? "opacity-60 transition-opacity" : undefined,
            )}
          >
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  {/* Product admin layout: a wide "product cell" packs
                      name + internal code together so we can recover
                      horizontal room for the price + size run columns
                      that people actually scan. */}
                  <TableHead className="w-[48%]">Product</TableHead>
                  <TableHead className="w-[22%]">Style</TableHead>
                  <TableHead className="w-[10%] text-right">MSRP</TableHead>
                  <TableHead className="w-[16%]">Size run</TableHead>
                  <TableHead className="w-[4%] sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id} className="group h-16">
                    <TableCell>
                      <Link
                        to={`${basePath}/plm/products/${p.id}`}
                        aria-label={p.name}
                        className="flex items-center gap-3"
                      >
                        <ProductThumb />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium leading-tight group-hover:underline">
                            {p.name}
                          </div>
                          <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                            {p.internal_product_code ?? "—"}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {p.style ? (
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-mono text-xs">
                            {p.style.style_number}
                          </span>
                          {p.style.style_name ? (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {p.style.style_name}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No style linked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.msrp != null ? (
                        <span className="text-sm font-semibold tabular-nums">
                          ${Number(p.msrp).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SizesCell variants={p.variants} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ProductRowActions
                        product={p}
                        detailHref={`${basePath}/plm/products/${p.id}`}
                        onDelete={() => setDeleteTarget(p)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "product"}?`}
        description="This permanently removes the product and all its variants. Sourcing rows on the linked style are untouched."
        confirmText={deleteProduct.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteProduct.mutateAsync({ id: deleteTarget.id });
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ProductThumb() {
  // Placeholder tile — sized like a typical product admin thumbnail.
  // Image URLs aren't on ProductListRow yet so we render an iconography
  // tile with subtle gradient so rows don't feel empty.
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-md border bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
      <IconCube className="size-4" />
    </div>
  );
}

function SizesCell({
  variants,
}: {
  variants: ProductListRow["variants"];
}) {
  const sizes = React.useMemo(() => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const v of variants ?? []) {
      const s = (v.size ?? "").trim();
      if (!s || seen.has(s)) continue;
      seen.add(s);
      unique.push(s);
    }
    return unique;
  }, [variants]);

  if (sizes.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  // One-line only — keep the row height uniform. Overflow gets a `+N` hint.
  const visible = sizes.slice(0, 3);
  const overflow = sizes.length - visible.length;
  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {visible.map((s) => (
        <Badge
          key={s}
          variant="outline"
          className="h-5 shrink-0 px-1.5 font-mono text-[10px]"
        >
          {s}
        </Badge>
      ))}
      {overflow > 0 ? (
        <span className="shrink-0 text-xs text-muted-foreground">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function ProductRowActions({
  product,
  detailHref,
  onDelete,
}: {
  product: ProductListRow;
  detailHref: string;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Actions for ${product.name}`}
          className="size-7 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={detailHref} className="flex items-center gap-2">
            <IconExternalLink className="size-4" />
            Open detail
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            to={`${detailHref}?edit=1`}
            className="flex items-center gap-2"
          >
            <IconPencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          variant="destructive"
        >
          <IconTrash className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
          <div className="size-10 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
