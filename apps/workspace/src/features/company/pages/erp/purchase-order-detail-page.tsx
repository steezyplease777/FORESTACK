// @ts-nocheck

import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";
import { usePurchaseOrder } from "@/lib/data/erp/purchase-orders/hooks";
import {
  useCancelAllocationOrder,
  useApproveAllocationOrder,
} from "@/lib/data/crm/allocation-orders/hooks";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  IconArrowLeft, IconPencil, IconCheck, IconX,
} from "@tabler/icons-react";

export function PurchaseOrderDetailPage() {
  const { id, companySlug } = useParams({
    from: "/$companySlug/_authed/erp/purchase-orders/$id/",
  });
  const { company } = useCompany();
  const companyId = company?.companyId ?? "";
  const { data: po, isLoading, error } = usePurchaseOrder(id);
  const cancelMutation = useCancelAllocationOrder(companyId);
  const approveMutation = useApproveAllocationOrder(companyId);
  const [activeTab, setActiveTab] = useState("overall");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading purchase order…</p>
      </div>
    );
  }
  if (error || !po) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Purchase order not found"}
        </p>
      </div>
    );
  }

  const vendor = po.vendor as Record<string, unknown> | null;
  const isDraft = po.status === "draft" || !po.status;
  const totalUnits = po.lines.reduce((s, l) => s + l.total_quantity, 0);
  const totalReceived = po.lines.reduce((s, l) => s + l.received_quantity, 0);
  const totalAllocated = po.lines.reduce(
    (s, l) => s + l.allocations.reduce((a, al) => a + (al.quantity ?? 0), 0),
    0,
  );

  const channelMap = new Map<string, { name: string; total: number }>();
  for (const line of po.lines) {
    for (const alloc of line.allocations) {
      const ch = alloc.sales_channel as Record<string, unknown> | null;
      const chId = (ch?.id as string) ?? alloc.sales_channel_id;
      const existing = channelMap.get(chId);
      if (existing) existing.total += alloc.quantity ?? 0;
      else
        channelMap.set(chId, {
          name: (ch?.name as string) ?? "Unknown",
          total: alloc.quantity ?? 0,
        });
    }
  }

  const allRequests = po.lines.flatMap((line) =>
    line.allocations.flatMap((alloc) =>
      alloc.crm_allocation_order_lines.map((crmLine) => ({
        crmLine,
        allocation: alloc,
        purchaseOrderLine: line,
      })),
    ),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5">
        <Link to={`/${companySlug}/erp/purchase-orders`}>
          <Button variant="ghost" size="icon" className="size-7">
            <IconArrowLeft className="size-3.5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-sm font-semibold">
            {po.purchase_order_number}
          </h1>
          <p className="text-xs text-muted-foreground">
            {(vendor?.name as string) ?? "—"} · Created{" "}
            {new Date(po.created_at).toLocaleDateString()}
          </p>
        </div>
        <Badge
          variant={
            po.status === "submitted"
              ? "info-light"
              : po.status === "closed"
                ? "success-light"
                : "outline"
          }
          size="sm"
        >
          {po.status ?? "draft"}
        </Badge>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-xs text-muted-foreground">
          Delivery: {new Date(po.purchase_order_date).toLocaleDateString()}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {isDraft && (
            <Link to={`/${companySlug}/erp/purchase-orders/${id}/edit`}>
              <Button size="sm" variant="outline">
                <IconPencil className="mr-1 size-3.5" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Tabbed card container */}
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <Card className="flex h-full flex-col gap-0 overflow-hidden p-0">
          <div className="border-b px-4 py-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="overall">Overall</TabsTrigger>
                <TabsTrigger value="channels">
                  Channels
                  {channelMap.size > 0 && (
                    <Badge variant="secondary" size="xs" className="ml-1.5">
                      {channelMap.size}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="requests">
                  CRM Requests
                  {allRequests.length > 0 && (
                    <Badge variant="secondary" size="xs" className="ml-1.5">
                      {allRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <CardContent className="min-h-0 flex-1 overflow-auto p-0">
            {activeTab === "overall" && (
              <>
                {po.lines.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No lines on this order.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 min-w-[180px] bg-background">
                          Product
                        </TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.lines.map((line) => {
                        const variant = line.product_variant as Record<string, unknown> | null;
                        const product = variant?.product as Record<string, unknown> | null;
                        const lineAlloc = line.allocations.reduce(
                          (s, a) => s + (a.quantity ?? 0),
                          0,
                        );
                        const lineTotal = line.total_quantity * line.quoted_price;
                        return (
                          <TableRow key={line.id}>
                            <TableCell className="sticky left-0 z-10 bg-background font-medium">
                              {(product?.name as string) ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {(variant?.sku as string) ?? "—"}
                            </TableCell>
                            <TableCell>{(variant?.size as string) ?? "—"}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {line.total_quantity}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {line.received_quantity}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              ${line.quoted_price}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              ${lineTotal.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={`font-medium tabular-nums ${lineAlloc >= line.total_quantity ? "text-green-600" : "text-amber-600"}`}
                              >
                                {lineAlloc}/{line.total_quantity}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </>
            )}

            {activeTab === "channels" && (
              <>
                {channelMap.size === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No channel allocations on this order.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 z-10 min-w-[180px] bg-background">
                          Product
                        </TableHead>
                        <TableHead>SKU</TableHead>
                        {Array.from(channelMap.entries()).map(
                          ([chId, { name }]) => (
                            <TableHead key={chId} className="text-right">
                              {name}
                            </TableHead>
                          ),
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.lines.map((line) => {
                        const variant = line.product_variant as Record<string, unknown> | null;
                        const product = variant?.product as Record<string, unknown> | null;
                        return (
                          <TableRow key={line.id}>
                            <TableCell className="sticky left-0 z-10 bg-background font-medium">
                              {(product?.name as string) ?? "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {(variant?.sku as string) ?? "—"}
                            </TableCell>
                            {Array.from(channelMap.keys()).map((chId) => {
                              const alloc = line.allocations.find((a) => {
                                const ch = a.sales_channel as Record<string, unknown> | null;
                                return (
                                  (ch?.id as string) === chId ||
                                  a.sales_channel_id === chId
                                );
                              });
                              return (
                                <TableCell
                                  key={chId}
                                  className="text-right tabular-nums"
                                >
                                  {alloc?.quantity ?? (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </>
            )}

            {activeTab === "requests" && (
              <>
                {allRequests.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No CRM allocation requests yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>CRM Account</TableHead>
                        <TableHead>Requested By</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead>Ship Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allRequests.map(
                        ({ crmLine, allocation, purchaseOrderLine }) => {
                          const order = crmLine.allocation_order as Record<string, unknown> | null;
                          const crmCompany = order?.crm_company as Record<string, unknown> | null;
                          const profile = order?.created_by_profile as Record<string, unknown> | null;
                          const name = profile
                            ? [profile.first_name, profile.last_name]
                                .filter(Boolean)
                                .join(" ") || "—"
                            : "—";
                          const variant = purchaseOrderLine.product_variant as Record<string, unknown> | null;
                          const ch = allocation.sales_channel as Record<string, unknown> | null;
                          const cancelled = !!(order?.cancel_date as string | null);
                          const orderId = order?.id as string;

                          return (
                            <TableRow key={crmLine.id}>
                              <TableCell className="font-medium">
                                {(crmCompany?.name as string) ?? "—"}
                              </TableCell>
                              <TableCell>{name}</TableCell>
                              <TableCell className="font-mono text-xs">
                                {(variant?.sku as string) ?? "—"}
                              </TableCell>
                              <TableCell>
                                {(ch?.name as string) ?? "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {crmLine.total_allocated_quantity}
                              </TableCell>
                              <TableCell>
                                {order?.ship_date
                                  ? new Date(
                                      order.ship_date as string,
                                    ).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    cancelled
                                      ? "destructive-light"
                                      : "success-light"
                                  }
                                  size="sm"
                                >
                                  {cancelled ? "Rejected" : "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {cancelled ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      approveMutation.mutate(orderId)
                                    }
                                    disabled={approveMutation.isPending}
                                  >
                                    <IconCheck className="mr-1 size-3.5" />
                                    Restore
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      cancelMutation.mutate(orderId)
                                    }
                                    disabled={cancelMutation.isPending}
                                  >
                                    <IconX className="mr-1 size-3.5" />
                                    Reject
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        },
                      )}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sticky bottom bar */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Total units:
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {totalUnits.toLocaleString()}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Received:
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {totalReceived.toLocaleString()}
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Allocated:
            </span>
            <span
              className={`text-sm font-semibold tabular-nums ${totalAllocated >= totalUnits ? "text-green-600" : "text-amber-600"}`}
            >
              {totalAllocated}/{totalUnits}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            Total cost:
          </span>
          <span className="text-base font-bold tabular-nums">
            ${po.total_amount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
