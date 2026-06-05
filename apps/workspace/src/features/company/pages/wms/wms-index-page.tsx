// @ts-nocheck

import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  IconArrowsTransferDown,
  IconBuildingWarehouse,
  IconChevronRight,
  IconPackage,
  IconPlus,
  IconShoppingCart,
  IconTag,
  IconTrendingUp,
  IconTruckDelivery,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { useAllocationOrders } from "@/lib/data/orders/allocation/hooks";
import { usePlmProducts } from "@/lib/data/plm/products/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * WMS module overview.
 *
 * This is the landing page when a user enters the Warehouse Management
 * module. It aggregates a handful of high-signal metrics from data we
 * already have on the client (allocations, product catalog) so the
 * initial paint does real work rather than just acting as a router
 * table. Individual module pages own their own deep views.
 */
export function WmsOverviewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const allocationsQuery = useAllocationOrders(companyId);
  const productsQuery = usePlmProducts(companyId);

  const stats = React.useMemo(() => {
    const allocations = allocationsQuery.data ?? [];
    const totalAllocated = allocations.reduce(
      (sum, a) => sum + (Number(a.quantity) || 0),
      0,
    );
    const channelIds = new Set<string>();
    for (const a of allocations) {
      const ch = a.erp_sales_channel as Record<string, unknown> | undefined;
      if (ch?.id) channelIds.add(String(ch.id));
    }

    // usePlmProducts now returns `{ rows, total, ... }`. This overview
    // only counts variants on the first page — enough for a quick
    // "pulse" metric without fanning out to fetch every page.
    const products = productsQuery.data?.rows ?? [];
    const variantCount = products.reduce(
      (sum, p) =>
        sum +
        (Array.isArray(p.variants) ? p.variants.length : 0),
      0,
    );

    return {
      openAllocations: allocations.length,
      allocatedUnits: totalAllocated,
      activeChannels: channelIds.size,
      skuCount: variantCount,
    };
  }, [allocationsQuery.data, productsQuery.data]);

  const recentAllocations = React.useMemo(() => {
    const list = allocationsQuery.data ?? [];
    // `created_at` is present on every allocation row; fall back to id for
    // deterministic ordering if the timestamp is ever missing.
    return [...list]
      .sort((a, b) => {
        const aT = a.created_at ? Date.parse(a.created_at as string) : 0;
        const bT = b.created_at ? Date.parse(b.created_at as string) : 0;
        if (aT !== bT) return bT - aT;
        return String(b.id).localeCompare(String(a.id));
      })
      .slice(0, 6);
  }, [allocationsQuery.data]);

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Warehouse Management"
        description="Move stock from vendors to channels — allocations, inventory, and outbound orders in one place."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/wms/inventory`}>
                <IconPackage className="size-4" />
                View Inventory
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`${basePath}/wms/allocation`}>
                <IconPlus className="size-4" />
                New Allocation
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid stats={stats} isLoading={allocationsQuery.isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentAllocationsCard
          allocations={recentAllocations}
          totalCount={stats.openAllocations}
          isLoading={allocationsQuery.isLoading}
          error={allocationsQuery.error}
          basePath={basePath}
        />
        <QuickLinksColumn basePath={basePath} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat grid
// ---------------------------------------------------------------------------

type StatCardDef = {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
};

function StatGrid({
  stats,
  isLoading,
}: {
  stats: {
    openAllocations: number;
    allocatedUnits: number;
    activeChannels: number;
    skuCount: number;
  };
  isLoading: boolean;
}) {
  const cards: StatCardDef[] = [
    {
      label: "Open Allocations",
      value: stats.openAllocations.toLocaleString(),
      hint: "Purchase-order lines currently allocated",
      icon: <IconArrowsTransferDown className="size-4" />,
    },
    {
      label: "Allocated Units",
      value: stats.allocatedUnits.toLocaleString(),
      hint: "Total units committed to sales channels",
      icon: <IconPackage className="size-4" />,
    },
    {
      label: "Active Channels",
      value: stats.activeChannels.toLocaleString(),
      hint: "Sales channels receiving allocations",
      icon: <IconShoppingCart className="size-4" />,
    },
    {
      label: "Product SKUs",
      value: stats.skuCount.toLocaleString(),
      hint: "Variants tracked in the catalog",
      icon: <IconTag className="size-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="@container/card shadow-xs transition-colors hover:border-primary/20"
        >
          <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
            <CardDescription className="text-xs font-medium text-muted-foreground">
              {card.label}
            </CardDescription>
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/5 text-primary ring-1 ring-primary/10">
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">
              {isLoading ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded-md bg-muted" />
              ) : (
                card.value
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-1">
              {card.hint}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent allocations
// ---------------------------------------------------------------------------

function RecentAllocationsCard({
  allocations,
  totalCount,
  isLoading,
  error,
  basePath,
}: {
  allocations: any[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  basePath: string;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Recent allocations</CardTitle>
          <CardDescription>
            The latest purchase-order lines routed to a sales channel.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to={`${basePath}/wms/allocation`}>
            View all
            <IconChevronRight className="size-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <AllocationTableSkeleton />
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load allocations
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        ) : allocations.length === 0 ? (
          <div className="py-8 text-center">
            <IconBuildingWarehouse className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No allocations yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Allocate purchase-order lines to sales channels to see them here.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((alloc) => {
                const variant = alloc.erp_purchase_order_line
                  ?.plm_product_variant as Record<string, unknown> | undefined;
                const salesChannel = alloc.erp_sales_channel as
                  | Record<string, unknown>
                  | undefined;
                const vendor = alloc.erp_vendor as
                  | Record<string, unknown>
                  | undefined;
                const productLabel =
                  (variant?.sku as string) ??
                  (variant?.size as string) ??
                  (variant?.id as string) ??
                  "—";

                return (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-medium">
                      {productLabel}
                    </TableCell>
                    <TableCell>
                      {salesChannel?.name ? (
                        <Badge variant="secondary">
                          {salesChannel.name as string}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(vendor?.name as string) ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {Number(alloc.quantity).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {!isLoading && allocations.length > 0 && totalCount > allocations.length ? (
        <CardFooter className="text-xs text-muted-foreground">
          Showing {allocations.length} of {totalCount}
        </CardFooter>
      ) : null}
    </Card>
  );
}

function AllocationTableSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-md border bg-muted/40 p-3"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quick links
// ---------------------------------------------------------------------------

type QuickLink = {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickLinksColumn({ basePath }: { basePath: string }) {
  const quickLinks: QuickLink[] = [
    {
      title: "Allocations",
      description: "Route PO lines to channels",
      url: `${basePath}/wms/allocation`,
      icon: IconArrowsTransferDown,
    },
    {
      title: "Inventory",
      description: "Stock levels and movement",
      url: `${basePath}/wms/inventory`,
      icon: IconPackage,
    },
    {
      title: "Orders",
      description: "Outbound fulfillment queue",
      url: `${basePath}/wms/orders`,
      icon: IconTruckDelivery,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jump to</CardTitle>
        <CardDescription>Deep views inside the WMS module.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-0">
        {quickLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <React.Fragment key={link.url}>
              {idx > 0 ? <Separator /> : null}
              <Link
                to={link.url}
                className="group -mx-3 flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{link.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {link.description}
                  </div>
                </div>
                <IconChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </React.Fragment>
          );
        })}
      </CardContent>
      <CardFooter className="flex items-center gap-2 border-t text-xs text-muted-foreground">
        <IconTrendingUp className="size-4" />
        More modules coming online soon.
      </CardFooter>
    </Card>
  );
}
