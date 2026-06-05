// @ts-nocheck
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  IconAddressBook,
  IconArrowsTransferDown,
  IconBuilding,
  IconCalendar,
  IconChevronRight,
  IconPackage,
  IconPlus,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { useCrmCompanies } from "@/lib/data/crm/companies/hooks";
import { useCrmAllocationOrders } from "@/lib/data/crm/allocation-orders/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
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
 * CRM module overview.
 *
 * Lands on `/crm` and surfaces customer and allocation-order
 * activity. Follows the same scaffolding every other portal
 * dashboard uses (header → stat grid → recent feed + deep links)
 * so the app stays visually consistent as more portals come
 * online.
 */
export function CrmOverviewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const companiesQuery = useCrmCompanies(companyId);
  const ordersQuery = useCrmAllocationOrders(companyId);

  const stats = React.useMemo(() => {
    const companies = companiesQuery.data ?? [];
    const orders = ordersQuery.data ?? [];

    const activeAccountIds = new Set<string>();
    let totalUnits = 0;
    let openOrders = 0;
    for (const o of orders) {
      const accountId =
        (o.crm_company as { id?: string } | null)?.id ??
        (o.crm_company_id as string | undefined);
      if (accountId) activeAccountIds.add(accountId);

      const status = String(o.status ?? "").toLowerCase();
      const isClosed =
        status === "cancelled" ||
        status === "canceled" ||
        status === "shipped" ||
        status === "delivered" ||
        status === "fulfilled" ||
        !!o.cancel_date;
      if (!isClosed) openOrders += 1;

      const lines = Array.isArray(o.lines) ? o.lines : [];
      for (const l of lines) {
        const qty = Number(l.total_allocated_quantity ?? 0);
        if (!Number.isNaN(qty)) totalUnits += qty;
      }
    }

    return {
      customerCount: companies.length,
      activeCustomers: activeAccountIds.size,
      allocationOrderCount: orders.length,
      openOrders,
      totalUnits,
    };
  }, [companiesQuery.data, ordersQuery.data]);

  const recentOrders = React.useMemo(() => {
    const list = ordersQuery.data ?? [];
    return [...list]
      .sort((a, b) => {
        const at = a.created_at ? Date.parse(a.created_at as string) : 0;
        const bt = b.created_at ? Date.parse(b.created_at as string) : 0;
        if (at !== bt) return bt - at;
        return String(b.id).localeCompare(String(a.id));
      })
      .slice(0, 6);
  }, [ordersQuery.data]);

  const isLoading = companiesQuery.isLoading || ordersQuery.isLoading;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Customer Relationship"
        description="Accounts, allocation orders, and fulfillment status for every customer."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/crm/customers`}>
                <IconUsers className="size-4" />
                View Customers
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={`${basePath}/crm/allocation-orders/new`}>
                <IconPlus className="size-4" />
                New Order
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid stats={stats} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentAllocationOrdersSection
          rows={recentOrders}
          totalCount={stats.allocationOrderCount}
          isLoading={ordersQuery.isLoading}
          error={ordersQuery.error}
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
    customerCount: number;
    activeCustomers: number;
    allocationOrderCount: number;
    openOrders: number;
    totalUnits: number;
  };
  isLoading: boolean;
}) {
  const cards: StatCardDef[] = [
    {
      label: "Customers",
      value: stats.customerCount.toLocaleString(),
      hint: `${stats.activeCustomers.toLocaleString()} with active orders`,
      icon: <IconUsers className="size-4" />,
    },
    {
      label: "Open Orders",
      value: stats.openOrders.toLocaleString(),
      hint: `${stats.allocationOrderCount.toLocaleString()} allocation orders all-time`,
      icon: <IconArrowsTransferDown className="size-4" />,
    },
    {
      label: "Allocated Units",
      value: stats.totalUnits.toLocaleString(),
      hint: "Units across every allocation order",
      icon: <IconPackage className="size-4" />,
    },
    {
      label: "Active Accounts",
      value: stats.activeCustomers.toLocaleString(),
      hint: "Customers with at least one order",
      icon: <IconBuilding className="size-4" />,
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

function orderStatusTone(
  status: string | null | undefined,
  cancelDate: string | null | undefined,
): string {
  if (cancelDate) return "bg-rose-50 text-rose-700 ring-rose-100";
  const s = String(status ?? "").toLowerCase();
  if (s === "shipped" || s === "delivered" || s === "fulfilled") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }
  if (s === "cancelled" || s === "canceled") {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }
  if (s === "approved" || s === "in_progress" || s === "in progress") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }
  if (s === "pending" || s === "open" || s === "draft" || s === "") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }
  return "bg-muted text-muted-foreground ring-border";
}

function orderStatusLabel(
  status: string | null | undefined,
  cancelDate: string | null | undefined,
): string {
  if (cancelDate) return "Cancelled";
  if (!status) return "Pending";
  return String(status).replace(/_/g, " ");
}

function RecentAllocationOrdersSection({
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
          <h3 className="text-sm font-semibold">Recent allocation orders</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The latest orders placed by customer accounts.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to={`${basePath}/crm/allocation-orders`}>
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
            Couldn't load orders
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center">
          <IconArrowsTransferDown className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No allocation orders yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first order to start fulfilling customer requests.
          </p>
          <Button size="sm" variant="outline" className="mt-4" asChild>
            <Link to={`${basePath}/crm/allocation-orders/new`}>
              <IconPlus className="size-4" />
              New order
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Ship Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Units</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((order) => {
                const account = order.crm_company as
                  | { id?: string; name?: string; company_code?: string | null }
                  | null;
                const lines = Array.isArray(order.lines) ? order.lines : [];
                const totalUnits = lines.reduce(
                  (sum: number, l: any) =>
                    sum + Number(l.total_allocated_quantity ?? 0),
                  0,
                );
                return (
                  <TableRow key={order.id} className="h-14">
                    <TableCell>
                      <Link
                        to={`${basePath}/crm/allocation-orders/${order.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <IconBuilding className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium hover:underline">
                            {account?.name ?? "—"}
                          </div>
                          {account?.company_code ? (
                            <div className="font-mono text-xs text-muted-foreground">
                              {account.company_code}
                            </div>
                          ) : null}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {order.ship_date ? (
                        <span className="inline-flex items-center gap-1.5">
                          <IconCalendar className="size-3.5" />
                          {new Date(order.ship_date).toLocaleDateString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1",
                          orderStatusTone(order.status, order.cancel_date),
                        )}
                      >
                        {orderStatusLabel(order.status, order.cancel_date)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {totalUnits > 0 ? (
                        <span className="font-medium">
                          {totalUnits.toLocaleString()}
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
          <div className="size-9 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
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
      title: "Customers",
      description: "Accounts and company profiles",
      url: `${basePath}/crm/customers`,
      icon: IconUsers,
    },
    {
      title: "Allocation Orders",
      description: "Customer orders against inventory",
      url: `${basePath}/crm/allocation-orders`,
      icon: IconArrowsTransferDown,
    },
    {
      title: "Contacts",
      description: "Named contacts at each account",
      url: `${basePath}/crm/contacts`,
      icon: IconAddressBook,
    },
  ];

  return (
    <section>
      <header className="mb-3 border-b pb-2">
        <h3 className="text-sm font-semibold">Jump to</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deep views inside the CRM module.
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
        Shipment tracking and invoicing coming soon.
      </div>
    </section>
  );
}
