// @ts-nocheck

import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";
import { useCrmCompanies } from "@/lib/data/crm/companies/hooks";
import { usePurchaseOrders } from "@/lib/data/erp/purchase-orders/hooks";
import { usePurchaseOrder } from "@/lib/data/erp/purchase-orders/hooks";
import { useCreateAllocationOrder } from "@/lib/data/crm/allocation-orders/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/reui/badge";
import { IconArrowLeft } from "@tabler/icons-react";

type LineSelection = {
  allocationId: string;
  quantity: number;
};

export function NewAllocationOrderPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const router = useRouter();

  const { data: crmCompanies } = useCrmCompanies(companyId);
  const { data: purchaseOrders } = usePurchaseOrders(companyId);
  const createMutation = useCreateAllocationOrder(companyId);

  const [selectedCrmCompanyId, setSelectedCrmCompanyId] = useState("");
  const [selectedPoId, setSelectedPoId] = useState("");
  const [shipDate, setShipDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineSelections, setLineSelections] = useState<
    Record<string, LineSelection>
  >({});

  const { data: selectedPo } = usePurchaseOrder(selectedPoId || null);

  const handleQuantityChange = (allocationId: string, qty: number) => {
    setLineSelections((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[allocationId];
        return next;
      }
      return {
        ...prev,
        [allocationId]: { allocationId, quantity: qty },
      };
    });
  };

  const selectedLines = Object.values(lineSelections).filter(
    (l) => l.quantity > 0
  );

  const handleSubmit = async () => {
    if (!selectedCrmCompanyId || !shipDate || selectedLines.length === 0) return;

    try {
      await createMutation.mutateAsync({
        order: {
          company_id: companyId,
          crm_company_id: selectedCrmCompanyId,
          ship_date: shipDate,
          notes: notes || undefined,
        },
        lines: selectedLines.map((l) => ({
          erp_purchase_order_line_allocation_id: l.allocationId,
          total_allocated_quantity: l.quantity,
        })),
      });
      router.push(`/${companySlug}/crm/allocation-orders`);
    } catch {
      // Error is handled by mutation state
    }
  };

  const isValid =
    !!selectedCrmCompanyId && !!shipDate && selectedLines.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to={`/${companySlug}/crm/allocation-orders`}>
          <Button variant="ghost" size="icon" className="size-8">
            <IconArrowLeft className="size-4" />
          </Button>
        </Link>
        <PageHeader
          title="New Allocation Order"
          description="Request product from purchase order lines for a CRM account."
        />
      </div>

      {/* Step 1: Select CRM Account + Ship Date */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Select the CRM account and ship date for this allocation order.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>CRM Account</Label>
            <Select
              value={selectedCrmCompanyId}
              onValueChange={setSelectedCrmCompanyId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer account" />
              </SelectTrigger>
              <SelectContent>
                {(crmCompanies ?? []).map((co) => (
                  <SelectItem key={co.id} value={co.id}>
                    {co.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ship Date</Label>
            <Input
              type="date"
              value={shipDate}
              onChange={(e) => setShipDate(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label>Notes (optional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this allocation order"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Select PO and lines */}
      <Card>
        <CardHeader>
          <CardTitle>Select Purchase Order</CardTitle>
          <CardDescription>
            Choose a purchase order to allocate lines from.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm space-y-2">
            <Label>Purchase Order</Label>
            <Select
              value={selectedPoId}
              onValueChange={(v) => {
                setSelectedPoId(v);
                setLineSelections({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase order" />
              </SelectTrigger>
              <SelectContent>
                {(purchaseOrders ?? []).map((po) => (
                  <SelectItem key={po.id} value={po.id}>
                    {po.purchase_order_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPo && selectedPo.lines.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sales Channel</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-right">Already Allocated</TableHead>
                  <TableHead className="w-32 text-right">
                    Request Qty
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedPo.lines.flatMap((line) => {
                  const variant = line.product_variant as Record<
                    string,
                    unknown
                  > | null;
                  const product = variant?.product as Record<
                    string,
                    unknown
                  > | null;

                  return line.allocations.map((alloc) => {
                    const salesChannel = alloc.sales_channel as Record<
                      string,
                      unknown
                    > | null;
                    const existingCrmQty = alloc.crm_allocation_order_lines.reduce(
                      (sum, cl) => sum + ((cl as Record<string, unknown>).total_allocated_quantity as number ?? cl.quantity ?? 0),
                      0
                    );
                    const availableQty = alloc.quantity - existingCrmQty;
                    const currentQty =
                      lineSelections[alloc.id]?.quantity ?? 0;

                    return (
                      <TableRow key={alloc.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">
                              {(product?.name as string) ?? "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(variant?.sku as string) ?? ""}{" "}
                              {(variant?.size as string)
                                ? `· ${variant?.size as string}`
                                : ""}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {salesChannel ? (
                            <Badge variant="secondary">
                              {salesChannel.name as string}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              availableQty > 0
                                ? "text-green-600"
                                : "text-muted-foreground"
                            }
                          >
                            {availableQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {existingCrmQty}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={availableQty}
                            value={currentQty || ""}
                            onChange={(e) =>
                              handleQuantityChange(
                                alloc.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="ml-auto h-8 w-20 text-right"
                            placeholder="0"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  });
                })}
              </TableBody>
            </Table>
          )}

          {selectedPo && selectedPo.lines.length === 0 && (
            <p className="text-sm text-muted-foreground">
              This purchase order has no lines to allocate.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary + Submit */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            {selectedLines.length} line{selectedLines.length !== 1 ? "s" : ""}{" "}
            selected ·{" "}
            {selectedLines.reduce((sum, l) => sum + l.quantity, 0)} total units
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-between">
          <Link to={`/${companySlug}/crm/allocation-orders`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending
              ? "Creating..."
              : "Create Allocation Order"}
          </Button>
        </CardFooter>
        {createMutation.isError && (
          <CardContent>
            <p className="text-sm text-destructive">
              {createMutation.error instanceof Error
                ? createMutation.error.message
                : "Failed to create allocation order"}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
