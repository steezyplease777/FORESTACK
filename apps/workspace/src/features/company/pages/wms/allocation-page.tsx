// @ts-nocheck

import { useCompany } from "@/features/company/tenant-provider";
import { useAllocationOrders } from "@/lib/data/orders/allocation/hooks";
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
export function AllocationPage() {
  const { company } = useCompany();
  const companyId = company?.companyId ?? "";
  const { data: allocations, isLoading, error } = useAllocationOrders(companyId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Allocations"
          description="Purchase order line allocations by sales channel."
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">
              Loading allocations...
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
          title="Allocations"
          description="Purchase order line allocations by sales channel."
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load allocations"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!allocations || allocations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Allocations"
          description="Purchase order line allocations by sales channel."
        />
        <EmptyState
          title="No allocations"
          description="Allocations will appear here when purchase order lines are allocated to sales channels."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Allocations"
        description="Purchase order line allocations by sales channel."
      />

      <Card>
        <CardHeader>
          <CardTitle>Allocation orders</CardTitle>
          <CardDescription>
            {allocations.length} allocation{allocations.length !== 1 ? "s" : ""} for this company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Sales channel</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Allocation order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((alloc) => {
                const variant = alloc.erp_purchase_order_line?.plm_product_variant as Record<string, unknown> | undefined;
                const salesChannel = alloc.erp_sales_channel as Record<string, unknown> | undefined;
                const vendor = alloc.erp_vendor as Record<string, unknown> | undefined;
                const crmLine = alloc.erp_purchase_order_line?.allocation_lines?.crm_allocation_order_line as Record<string, unknown> | undefined;
                const crmOrder = crmLine?.crm_allocation_order_id as Record<string, unknown> | undefined;
                const crmCompany = crmOrder?.crm_company_id as Record<string, unknown> | undefined;

                return (
                  <TableRow key={alloc.id}>
                    <TableCell className="font-medium">
                      {(variant?.sku ?? variant?.size ?? variant?.id ?? "—") as string}
                    </TableCell>
                    <TableCell>
                      {(salesChannel?.name ?? "—") as string}
                    </TableCell>
                    <TableCell>
                      {(vendor?.name ?? "—") as string}
                    </TableCell>
                    <TableCell className="text-right">
                      {alloc.quantity}
                    </TableCell>
                    <TableCell>
                      {crmCompany ? (
                        <Badge variant="secondary">
                          {(crmCompany.name ?? crmCompany.id) as string}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
