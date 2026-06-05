// @ts-nocheck

import { useMemo } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";
import { usePurchaseOrders } from "@/lib/data/erp/purchase-orders/hooks";

const routeApi = getRouteApi("/$companySlug/_authed/erp/purchase-orders/");
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/reui/badge";
import { Input } from "@/components/ui/input";
import { PurchaseOrdersTable } from "@/features/company/modules/erp/purchase-orders/purchase-orders-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { IconPlus, IconSearch } from "@tabler/icons-react";

export function PurchaseOrdersPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const { data: orders, isLoading, error } = usePurchaseOrders(companyId);
  const { q: search, status: statusFilter } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const setSearch = (q: string) =>
    navigate({ search: (prev) => ({ ...prev, q }) });
  const setStatusFilter = (status: "all" | "draft" | "submitted" | "closed") =>
    navigate({ search: (prev) => ({ ...prev, status }) });

  const filtered = useMemo(() => {
    if (!orders) return [];
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((po) => (po.status ?? "draft") === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (po) =>
          po.purchase_order_number.toLowerCase().includes(q) ||
          po.internal_code.toLowerCase().includes(q) ||
          ((po.vendor as Record<string, unknown>)?.name as string ?? "")
            .toLowerCase()
            .includes(q),
      );
    }
    return result;
  }, [orders, search, statusFilter]);

  const counts = useMemo(() => {
    if (!orders) return { all: 0, draft: 0, submitted: 0, closed: 0 };
    return {
      all: orders.length,
      draft: orders.filter((o) => (o.status ?? "draft") === "draft").length,
      submitted: orders.filter((o) => o.status === "submitted").length,
      closed: orders.filter((o) => o.status === "closed").length,
    };
  }, [orders]);

  const actions = (
    <Link to={`/${companySlug}/erp/purchase-orders/new`}>
      <Button size="sm">
        <IconPlus className="mr-1.5 size-4" />
        Create draft order
      </Button>
    </Link>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Manage and track your purchase orders."
        actions={actions}
      />

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">
                All
                <Badge variant="secondary" size="xs" className="ml-1.5">
                  {counts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="draft">
                Draft
                <Badge variant="outline" size="xs" className="ml-1.5">
                  {counts.draft}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="submitted">
                Submitted
                <Badge variant="info-light" size="xs" className="ml-1.5">
                  {counts.submitted}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed
                <Badge variant="success-light" size="xs" className="ml-1.5">
                  {counts.closed}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-64 pl-8"
              placeholder="Search orders…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              Loading purchase orders…
            </p>
          ) : error ? (
            <p className="py-20 text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No purchase orders"
              description={
                orders?.length
                  ? "No orders match your filters."
                  : "No purchase orders yet."
              }
            />
          ) : (
            <PurchaseOrdersTable orders={filtered} companySlug={companySlug} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
