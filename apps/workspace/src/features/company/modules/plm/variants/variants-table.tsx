// @ts-nocheck

import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/composites/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantWithRefs } from "@/lib/data/plm/variants/types";

const columns = (basePath: string): ColumnDef<VariantWithRefs>[] => [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="truncate text-xs font-medium">{row.original.sku}</span>
    ),
    meta: {
      headClassName:
        "w-[24%] font-mono text-[11px] font-semibold uppercase tracking-wider",
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="h-5 px-1.5 font-mono text-[10px]"
      >
        {row.original.size}
      </Badge>
    ),
    meta: {
      headClassName:
        "w-[8%] font-mono text-[11px] font-semibold uppercase tracking-wider",
    },
  },
  {
    accessorKey: "upc",
    header: "UPC",
    cell: ({ row }) => (
      <span className="truncate text-[11px] text-muted-foreground">
        {row.original.upc ?? "—"}
      </span>
    ),
    meta: {
      headClassName:
        "w-[18%] font-mono text-[11px] font-semibold uppercase tracking-wider",
    },
  },
  {
    id: "product",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original.product;
      return product ? (
        <Link
          to={`${basePath}/plm/products/${product.id}`}
          className="truncate font-sans text-xs hover:underline"
        >
          {product.name}
        </Link>
      ) : (
        <span className="font-sans text-xs text-muted-foreground">—</span>
      );
    },
    meta: {
      headClassName:
        "w-[32%] font-mono text-[11px] font-semibold uppercase tracking-wider",
    },
  },
  {
    id: "style",
    header: "Style",
    cell: ({ row }) =>
      row.original.product?.style ? (
        <span className="truncate text-[11px] text-muted-foreground">
          {row.original.product.style.style_number}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    meta: {
      headClassName:
        "w-[18%] font-mono text-[11px] font-semibold uppercase tracking-wider",
    },
  },
];

export function VariantsTable({
  rows,
  basePath,
  className,
}: {
  rows: VariantWithRefs[];
  basePath: string;
  className?: string;
}) {
  return (
    <DataTable
      columns={columns(basePath)}
      data={rows}
      className={cn(
        "overflow-hidden rounded-md border-0 bg-background font-mono",
        className,
      )}
      tableClassName="table-fixed border-0 [&_td]:py-2 [&_th]:py-2"
      headerRowClassName="bg-muted/40 hover:bg-muted/40"
      rowClassName="h-10 odd:bg-background even:bg-muted/20"
    />
  );
}
