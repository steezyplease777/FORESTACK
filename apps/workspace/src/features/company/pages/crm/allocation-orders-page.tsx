// @ts-nocheck

import { Link } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";
import { useCrmAllocationOrders } from "@/lib/data/crm/allocation-orders/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/reui/badge";
import { IconPlus } from "@tabler/icons-react";

export function AllocationOrdersPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const { data: orders, isLoading, error } = useCrmAllocationOrders(companyId);

  const actions = (
    <Link to={`/${companySlug}/crm/allocation-orders/new`}>
      <Button size="sm">
        <IconPlus className="mr-1 size-4" />
        New Request
      </Button>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Allocation Orders"
          description="CRM allocation requests for purchase order lines."
          actions={actions}
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">
              Loading allocation orders...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Allocation Orders"
          description="CRM allocation requests for purchase order lines."
          actions={actions}
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to load allocation orders"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Allocation Orders"
          description="CRM allocation requests for purchase order lines."
          actions={actions}
        />
        <EmptyState
          title="No allocation orders"
          description="Create your first allocation order to request product from purchase order lines."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allocation Orders"
        description="CRM allocation requests for purchase order lines."
        actions={actions}
      />

      <Card>
        <CardHeader>
          <CardTitle>All allocation orders</CardTitle>
          <CardDescription>
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CRM Account</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Ship Date</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const crmCompany = order.crm_company as Record<
                  string,
                  unknown
                > | null;
                const profile = order.created_by_profile;
                const creatorName = profile
                  ? [profile.first_name, profile.last_name]
                      .filter(Boolean)
                      .join(" ") || "—"
                  : "—";
                const isCancelled = !!order.cancel_date;
                const totalQty = order.lines.reduce(
                  (sum, l) => sum + ((l as Record<string, unknown>).total_allocated_quantity as number ?? l.quantity ?? 0),
                  0
                );

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {(crmCompany?.name as string) ?? "Unknown"}
                    </TableCell>
                    <TableCell>{creatorName}</TableCell>
                    <TableCell>
                      {new Date(order.ship_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{order.lines.length}</TableCell>
                    <TableCell className="text-right">{totalQty}</TableCell>
                    <TableCell className="max-w-48 truncate text-xs text-muted-foreground">
                      {order.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isCancelled ? "destructive-light" : "success-light"}
                        size="sm"
                      >
                        {isCancelled ? "Cancelled" : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
