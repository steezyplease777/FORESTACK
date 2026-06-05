// @ts-nocheck

import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { IconDots, IconFileInvoice } from "@tabler/icons-react";

import { DataTable } from "@/components/composites/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import type { PurchaseOrderWithVendor } from "@/lib/data/erp/purchase-orders/types";

const STATUS_BADGE_VARIANT = {
  draft: "outline",
  submitted: "info-light",
  closed: "success-light",
} as const;

function destinationChannels(po: PurchaseOrderWithVendor): string {
  const channels = new Set<string>();
  if (po.lines) {
    for (const line of po.lines) {
      if (line.allocations) {
        for (const a of line.allocations) {
          const ch = a.sales_channel as Record<string, unknown> | null;
          if (ch?.name) channels.add(ch.name as string);
        }
      }
    }
  }
  return channels.size > 0 ? Array.from(channels).join(", ") : "—";
}

function totalUnits(po: PurchaseOrderWithVendor): number {
  return (
    po.lines?.reduce(
      (s, l) => s + ((l.total_quantity as number) ?? 0),
      0,
    ) ?? 0
  );
}

const columns = (
  companySlug: string,
): ColumnDef<PurchaseOrderWithVendor>[] => [
  {
    id: "order",
    header: "Order",
    cell: ({ row }) => {
      const po = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-muted">
            <IconFileInvoice className="size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <Link
              to={`/${companySlug}/erp/purchase-orders/${po.id}`}
              className="text-sm font-medium text-primary hover:underline"
            >
              {po.purchase_order_number}
            </Link>
            <span className="text-xs text-muted-foreground">
              {po.internal_code}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "supplier",
    header: "Supplier",
    cell: ({ row }) => {
      const vendor = row.original.vendor as Record<string, unknown> | null;
      return (vendor?.name as string) ?? "—";
    },
  },
  {
    id: "units",
    header: () => <span className="block text-right">Units</span>,
    cell: ({ row }) => (
      <span className="block text-right tabular-nums">
        {totalUnits(row.original).toLocaleString()}
      </span>
    ),
    meta: { headClassName: "text-right", cellClassName: "text-right" },
  },
  {
    id: "destinations",
    header: "Destinations",
    cell: ({ row }) => (
      <span className="block max-w-[160px] truncate">
        {destinationChannels(row.original)}
      </span>
    ),
  },
  {
    accessorKey: "purchase_order_date",
    header: "Delivery",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ),
  },
  {
    accessorKey: "total_amount",
    header: () => <span className="block text-right">Total cost</span>,
    cell: ({ getValue }) => (
      <span className="block text-right font-medium tabular-nums">
        ${Number(getValue<number>()).toLocaleString()}
      </span>
    ),
    meta: { headClassName: "text-right", cellClassName: "text-right" },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const statusValue = (row.original.status ?? "draft") as keyof typeof STATUS_BADGE_VARIANT;
      return (
        <Badge
          variant={STATUS_BADGE_VARIANT[statusValue] ?? "outline"}
          size="sm"
        >
          {statusValue}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: () => (
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <IconDots className="size-4" />
      </Button>
    ),
    meta: { headClassName: "w-10", cellClassName: "w-10" },
  },
];

export function PurchaseOrdersTable({
  orders,
  companySlug,
}: {
  orders: PurchaseOrderWithVendor[];
  companySlug: string;
}) {
  return (
    <DataTable
      columns={columns(companySlug)}
      data={orders}
      className="rounded-none border-0 bg-transparent"
      rowClassName="group"
    />
  );
}
