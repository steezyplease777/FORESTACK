// @ts-nocheck
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  IconBuildingStore,
  IconChevronRight,
  IconFileInvoice,
  IconGitPullRequest,
  IconPlus,
  IconShoppingCart,
  IconTrendingUp,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { usePurchaseOrders } from "@/lib/data/erp/purchase-orders/hooks";
import { useVendors } from "@/lib/data/erp/vendors/hooks";
import { useSalesChannels } from "@/lib/data/erp/sales-channels/hooks";
import { useCrmAllocationOrders } from "@/lib/data/crm/allocation-orders/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * ERP module overview.
 *
 * Aggregates high-signal counts already available on the client
 * (purchase orders, vendors, sales channels, allocation requests)
 * into a single landing page. Mirrors the PM/WMS dashboards so
 * every portal shares the same shell + stat-grid + recent-feed
 * pattern.
 */
export function ErpOverviewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const purchaseOrdersQuery = usePurchaseOrders(companyId);
  const vendorsQuery = useVendors(companyId);
  const salesChannelsQuery = useSalesChannels();
  const allocationRequestsQuery = useCrmAllocationOrders(companyId);

  const stats = React.useMemo(() => {
    const pos = purchaseOrdersQuery.data ?? [];
    const vendors = vendorsQuery.data ?? [];
    const channels = salesChannelsQuery.data ?? [];
    const requests = allocationRequestsQuery.data ?? [];

    const openPoCount = pos.filter((po) => {
      const status = String(po.status ?? "").toLowerCase();
      return status !== "received" && status !== "closed" && status !== "cancelled";
    }).length;

    const pendingRequests = requests.filter((r) => {
      const status = String(r.status ?? "").toLowerCase();
      return status === "pending" || status === "open" || status === "";
    }).length;

    return {
      poCount: pos.length,
      openPoCount,
      vendorCount: vendors.length,
      channelCount: channels.length,
      requestCount: requests.length,
      pendingRequests,
    };
  }, [
    purchaseOrdersQuery.data,
    vendorsQuery.data,
    salesChannelsQuery.data,
    allocationRequestsQuery.data,
  ]);

  const recentPos = React.useMemo(() => {
    const list = purchaseOrdersQuery.data ?? [];
    return [...list]
      .sort((a, b) => {
        const at = a.created_at ? Date.parse(a.created_at as string) : 0;
        const bt = b.created_at ? Date.parse(b.created_at as string) : 0;
        if (at !== bt) return bt - at;
        return String(b.id).localeCompare(String(a.id));
      })
      .slice(0, 6);
  }, [purchaseOrdersQuery.data]);

  const isLoading =
    purchaseOrdersQuery.isLoading ||
    vendorsQuery.isLoading ||
    salesChannelsQuery.isLoading ||
    allocationRequestsQuery.isLoading;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Enterprise Resource Planning"
        description="Purchase orders, vendors, sales channels, and allocation requests at a glance."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/erp/purchase-orders`}>
                <IconFileInvoice className="size-4" />
                View POs
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`${basePath}/erp/purchase-orders/new`}>
                <IconPlus className="size-4" />
                New PO
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid stats={stats} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentPurchaseOrdersSection
          rows={recentPos}
          totalCount={stats.poCount}
          isLoading={purchaseOrdersQuery.isLoading}
          error={purchaseOrdersQuery.error}
          basePath={basePath}
        />
        <QuickLinksColumn basePath={basePath} />
      </div>
    </div>
  );
}

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
    poCount: number;
    openPoCount: number;
    vendorCount: number;
    channelCount: number;
    requestCount: number;
    pendingRequests: number;
  };
  isLoading: boolean;
}) {
  const cards: StatCardDef[] = [
    {
      label: "Open POs",
      value: stats.openPoCount.toLocaleString(),
      hint: `${stats.poCount.toLocaleString()} total purchase orders`,
      icon: <IconFileInvoice className="size-4" />,
    },
    {
      label: "Vendors",
      value: stats.vendorCount.toLocaleString(),
      hint: "Suppliers registered for this company",
      icon: <IconBuildingStore className="size-4" />,
    },
    {
      label: "Sales Channels",
      value: stats.channelCount.toLocaleString(),
      hint: "Destinations allocations can route to",
      icon: <IconShoppingCart className="size-4" />,
    },
    {
      label: "Allocation Requests",
      value: stats.pendingRequests.toLocaleString(),
      hint: `${stats.requestCount.toLocaleString()} total, pending review`,
      icon: <IconGitPullRequest className="size-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-md border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary ring-1 ring-primary/10">
              {card.icon}
            </div>
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
            {isLoading ? (
              <span className="inline-block h-8 w-16 animate-pulse rounded-md bg-muted" />
            ) : (
              card.value
            )}
          </div>
          <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
            {card.hint}
          </p>
        </div>
      ))}
    </div>
  );
}

function poStatusTone(status: string | null | undefined): string {
  const s = String(status ?? "").toLowerCase();
  if (s === "received" || s === "closed") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  if (s === "cancelled" || s === "canceled") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }
  if (s === "shipped" || s === "in_transit" || s === "in transit") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }
  if (s === "pending" || s === "open" || s === "draft") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  return "bg-muted text-muted-foreground ring-border";
}

function RecentPurchaseOrdersSection({
  rows,
  totalCount,
  isLoading,
  error,
  basePath,
}: {
  rows: any[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  basePath: string;
}) {
  return (
    <section className="lg:col-span-2">
      <header className="mb-3 flex items-start justify-between gap-3 border-b pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Recent purchase orders</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The latest POs created across all vendors.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to={`${basePath}/erp/purchase-orders`}>
            View all
            <IconChevronRight className="size-4" />
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <RecentSkeleton />
      ) : error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Couldn't load purchase orders
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center">
          <IconFileInvoice className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No purchase orders yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Issue your first PO to a vendor to start tracking orders.
          </p>
          <Button size="sm" variant="outline" className="mt-4" asChild>
            <Link to={`${basePath}/erp/purchase-orders/new`}>
              <IconPlus className="size-4" />
              New purchase order
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((po) => {
                const vendor = po.vendor as
                  | { id?: string; name?: string }
                  | null;
                const total =
                  po.total_amount != null ? Number(po.total_amount) : null;
                return (
                  <TableRow key={po.id} className="h-14">
                    <TableCell>
                      <Link
                        to={`${basePath}/erp/purchase-orders/${po.id}`}
                        className="flex min-w-0 flex-col"
                      >
                        <span className="truncate font-mono text-sm font-medium hover:underline">
                          {po.purchase_order_number ?? "—"}
                        </span>
                        {po.created_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(po.created_at).toLocaleDateString()}
                          </span>
                        ) : null}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {vendor?.name ? (
                        <span className="text-sm">{vendor.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {po.status ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1",
                            poStatusTone(po.status),
                          )}
                        >
                          {String(po.status).replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {total != null ? (
                        <span className="font-medium">
                          ${total.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && rows.length > 0 && totalCount > rows.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {rows.length} of {totalCount}
        </p>
      ) : null}
    </section>
  );
}

function RecentSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-md border bg-muted/40 p-3"
        >
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

type QuickLink = {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickLinksColumn({ basePath }: { basePath: string }) {
  const quickLinks: QuickLink[] = [
    {
      title: "Purchase Orders",
      description: "Issue and track vendor POs",
      url: `${basePath}/erp/purchase-orders`,
      icon: IconFileInvoice,
    },
    {
      title: "Allocation Requests",
      description: "Review requests from CRM accounts",
      url: `${basePath}/erp/allocation-requests`,
      icon: IconGitPullRequest,
    },
    {
      title: "Vendors",
      description: "Supplier catalog and contacts",
      url: `${basePath}/erp/vendors`,
      icon: IconBuildingStore,
    },
    {
      title: "Sales Channels",
      description: "Routes your allocations can fill",
      url: `${basePath}/erp/sales-channels`,
      icon: IconShoppingCart,
    },
  ];

  return (
    <section>
      <header className="mb-3 border-b pb-2">
        <h3 className="text-sm font-semibold">Jump to</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deep views inside the ERP module.
        </p>
      </header>
      <div className="flex flex-col gap-2">
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
                <div className="min-w-0 flex-1">
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
      </div>
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <IconTrendingUp className="size-4" />
        Receiving and reconciliation flows coming soon.
      </div>
    </section>
  );
}
