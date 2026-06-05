// @ts-nocheck

import { useCompany } from "@/features/company/tenant-provider";
import { useCrmAllocationOrders } from "@/lib/data/crm/allocation-orders/hooks";
import {
  useCancelAllocationOrder,
  useApproveAllocationOrder,
} from "@/lib/data/crm/allocation-orders/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
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
import { Button } from "@/components/ui/button";
import { IconCheck, IconX } from "@tabler/icons-react";

export function AllocationRequestsPage() {
  const { company } = useCompany();
  const companyId = company?.companyId ?? "";
  const { data: orders, isLoading, error } = useCrmAllocationOrders(companyId);
  const cancelMutation = useCancelAllocationOrder(companyId);
  const approveMutation = useApproveAllocationOrder(companyId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Allocation Requests"
          description="Review allocation requests from CRM accounts."
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">
              Loading requests...
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
          title="Allocation Requests"
          description="Review allocation requests from CRM accounts."
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to load requests"}
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
          title="Allocation Requests"
          description="Review allocation requests from CRM accounts."
        />
        <EmptyState
          title="No allocation requests"
          description="Allocation requests from CRM accounts will appear here."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allocation Requests"
        description="Review allocation requests from CRM accounts."
      />

      <Card>
        <CardHeader>
          <CardTitle>All requests</CardTitle>
          <CardDescription>
            {orders.length} allocation order{orders.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CRM Account</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Ship Date</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead className="text-right">Total Qty</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                  (sum, l) => sum + l.total_allocated_quantity,
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
                        {isCancelled ? "Rejected" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isCancelled ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              approveMutation.mutate(order.id)
                            }
                            disabled={approveMutation.isPending}
                          >
                            <IconCheck className="mr-1 size-3" />
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              cancelMutation.mutate(order.id)
                            }
                            disabled={cancelMutation.isPending}
                          >
                            <IconX className="mr-1 size-3" />
                            Reject
                          </Button>
                        )}
                      </div>
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
