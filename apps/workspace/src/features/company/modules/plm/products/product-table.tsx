// @ts-nocheck

import { useMemo } from "react";
import { getRouteApi } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/composites/data-table";
import type { ProductWithVariants } from "@/lib/data/plm/products/client";
import { IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { usePlmProducts } from "@/lib/data/plm/products/hooks";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ProductDetail from "./product-detail";

const routeApi = getRouteApi("/$companySlug/plm/products");

const PAGE_SIZE = 100;

function sizesLabel(product: ProductWithVariants) {
  const sizes = (product.variants ?? [])
    .map((v) => v.size)
    .filter((s): s is string => !!s && s.trim().length > 0);

  const seen = new Set<string>();
  const unique = sizes.filter((s) => (seen.has(s) ? false : (seen.add(s), true)));

  return unique.length ? unique.join(", ") : "—";
}

const columns: ColumnDef<ProductWithVariants>[] = [
  {
    accessorKey: "name",
    header: "Title",
    cell: ({ row }) => row.original.name,
  },
  {
    id: "style_number",
    header: () => <span className="block text-center">Style Number</span>,
    cell: ({ row }) => (
      <span className="block text-center">
        {row.original.style?.style_number ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "msrp",
    header: () => <span className="block text-center">MSRP</span>,
    cell: ({ getValue }) => (
      <span className="block text-center">{getValue<string>() ?? "—"}</span>
    ),
  },
  {
    id: "sizes",
    header: () => <span className="block text-center">Sizes</span>,
    cell: ({ row }) => (
      <span className="block text-center">{sizesLabel(row.original)}</span>
    ),
  },
];

export default function ProductTable({ companyId }: { companyId: string }) {
  const { data: ProductsWithVariants } = usePlmProducts(companyId);
  const products = ProductsWithVariants ?? [];

  const { q: search, page, recordId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();

    return products.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const code = (p.internal_product_code ?? "").toLowerCase();
      const style = (p.style?.style_number ?? "").toLowerCase();

      if (name.includes(q) || code.includes(q) || style.includes(q)) return true;

      return (p.variants ?? []).some((v) => (v.sku ?? "").toLowerCase().includes(q));
    });
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageSlice = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const handleSearchChange = (value: string) =>
    navigate({ search: (prev) => ({ ...prev, q: value, page: 0 }) });

  const setPage = (updater: (p: number) => number) =>
    navigate({ search: (prev) => ({ ...prev, page: updater(prev.page ?? 0) }) });

  const setRecordId = (id: string | undefined) =>
    navigate({ search: (prev) => ({ ...prev, recordId: id }) });

  const detailProduct = recordId
    ? products.find((product) => product.id === recordId)
    : undefined;

  return (
    <div className="flex w-full flex-col rounded-[2px] border bg-card">
      <div className="border-b px-2 py-2">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 w-full rounded-[1px] border-none pl-8 shadow-none"
            placeholder="Search by name, code, style, or SKU…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pageSlice}
        className="rounded-none border-0 bg-transparent"
        emptyMessage={
          search ? "No products match your search." : "No products yet."
        }
        onRowClick={(product) => setRecordId(product.id)}
      />

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} products
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-6"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="min-w-[4rem] text-center text-sm">
              Page {safePage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-6"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <IconChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Sheet
        open={!!recordId}
        onOpenChange={(open) => {
          if (!open) setRecordId(undefined);
        }}
      >
        <SheetContent className="max-w-2xl">
          {detailProduct && <ProductDetail productDetail={detailProduct} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
