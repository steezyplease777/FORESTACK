// @ts-nocheck

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";
import { useVendors, useCreateVendor, useVendorCategories } from "@/lib/data/erp/vendors/hooks";
import { useSalesChannels, useCreateSalesChannel } from "@/lib/data/erp/sales-channels/hooks";
import { usePlmProducts } from "@/lib/data/plm/products/hooks";
import type { ProductWithVariants, PlmProductVariant } from "@/lib/data/plm/products/client";
import { useCreatePurchaseOrder, useUpdatePurchaseOrder } from "@/lib/data/erp/purchase-orders/hooks";
import type { POLineInput, PurchaseOrderDetail } from "@/lib/data/erp/purchase-orders/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  IconArrowLeft, IconPlus, IconTrash, IconSearch,
  IconDeviceFloppy, IconSend, IconPackage, IconDots, IconFileText,
} from "@tabler/icons-react";

type VariantLine = {
  variant: PlmProductVariant;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  allocations: Record<string, number>;
};

interface POFormProps {
  mode: "create" | "edit";
  existingPO?: PurchaseOrderDetail | null;
}

export function POForm({ mode, existingPO }: POFormProps) {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const router = useRouter();

  const { data: vendors } = useVendors(companyId);
  const { data: vendorCategories } = useVendorCategories(companyId);
  const { data: channels } = useSalesChannels();
  const channelCategories: { id: string; name: string }[] = [];
  // usePlmProducts was converted to a paginated hook; this form does
  // its own local filter+picker over the catalog, so we ask for a big
  // page (max: 200) and flatten into the array shape the rest of the
  // file expects. If a tenant's catalog exceeds that cap the picker
  // should switch to the server-side `usePlmProductSearch` hook.
  const { data: productsResult } = usePlmProducts(companyId, {
    pageSize: 200,
  });
  const products = productsResult?.rows;
  const createPO = useCreatePurchaseOrder(companyId);
  const updatePO = useUpdatePurchaseOrder(companyId, existingPO?.id ?? "");
  const createVendor = useCreateVendor(companyId);
  const createChannel = useCreateSalesChannel();

  // Header fields
  const [vendorId, setVendorId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [internalCode, setInternalCode] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Flat list of lines keyed by variantId, plus product tracking
  const [lines, setLines] = useState<Record<string, VariantLine>>({});
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());
  const [gridSearch, setGridSearch] = useState("");

  // Sheet states
  const [vendorSheetOpen, setVendorSheetOpen] = useState(false);
  const [channelSheetOpen, setChannelSheetOpen] = useState(false);
  const [productSheetOpen, setProductSheetOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [newVendor, setNewVendor] = useState({ name: "", category_id: "" });
  const [newChannel, setNewChannel] = useState({ name: "", category_id: "" });

  // Hydrate from existing PO
  useEffect(() => {
    if (mode !== "edit" || !existingPO || !products) return;
    setVendorId(existingPO.vendor_id);
    setPoNumber(existingPO.purchase_order_number);
    setPoDate(existingPO.purchase_order_date.split("T")[0]);
    setInternalCode(existingPO.internal_code);
    setStatus(existingPO.status ?? "draft");
    setNotes(existingPO.notes ?? "");
    setCarrier(existingPO.carrier ?? "");
    setTrackingNumber(existingPO.tracking_number ?? "");

    const hydratedLines: Record<string, VariantLine> = {};
    const productIds = new Set<string>();

    for (const line of existingPO.lines) {
      const variant = line.product_variant as Record<string, unknown> | null;
      if (!variant) continue;
      const product = variant.product as Record<string, unknown> | null;
      if (!product) continue;
      const productId = product.id as string;
      const variantId = variant.id as string;
      productIds.add(productId);

      const fullProduct = products.find((p) => p.id === productId);
      if (fullProduct) {
        for (const v of fullProduct.variants) {
          if (!hydratedLines[v.id]) {
            hydratedLines[v.id] = {
              variant: v,
              productName: fullProduct.name,
              productCode: fullProduct.internal_product_code ?? "",
              quantity: 0, price: 0, allocations: {},
            };
          }
        }
      }

      if (hydratedLines[variantId]) {
        hydratedLines[variantId].quantity = line.total_quantity;
        hydratedLines[variantId].price = line.quoted_price;
        for (const alloc of line.allocations) {
          hydratedLines[variantId].allocations[alloc.sales_channel_id] = alloc.quantity;
        }
      }
    }
    setLines(hydratedLines);
    setAddedProducts(productIds);
  }, [mode, existingPO, products]);

  // Product picker search
  const filteredProducts = useMemo(() => {
    if (!products || productSearch.length < 2) return [];
    const q = productSearch.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.internal_product_code ?? "").toLowerCase().includes(q))
      .filter((p) => !addedProducts.has(p.id))
      .slice(0, 30);
  }, [products, productSearch, addedProducts]);

  const addProduct = useCallback((product: ProductWithVariants) => {
    setLines((prev) => {
      const next = { ...prev };
      for (const v of product.variants) {
        if (!next[v.id]) {
          next[v.id] = {
            variant: v,
            productName: product.name,
            productCode: product.internal_product_code ?? "",
            quantity: 0, price: 0, allocations: {},
          };
        }
      }
      return next;
    });
    setAddedProducts((prev) => new Set([...prev, product.id]));
    setProductSearch("");
    setProductSheetOpen(false);
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setLines((prev) => {
      const next: Record<string, VariantLine> = {};
      for (const [vId, line] of Object.entries(prev)) {
        if (line.variant.product_id !== productId) next[vId] = line;
      }
      return next;
    });
    setAddedProducts((prev) => { const n = new Set(prev); n.delete(productId); return n; });
  }, []);

  const updateQty = useCallback((vId: string, qty: number) => {
    setLines((prev) => ({ ...prev, [vId]: { ...prev[vId], quantity: Math.max(0, qty) } }));
  }, []);

  const updatePrice = useCallback((vId: string, price: number) => {
    setLines((prev) => ({ ...prev, [vId]: { ...prev[vId], price: Math.max(0, price) } }));
  }, []);

  const updateAlloc = useCallback((vId: string, chId: string, qty: number) => {
    setLines((prev) => ({
      ...prev,
      [vId]: { ...prev[vId], allocations: { ...prev[vId].allocations, [chId]: Math.max(0, qty) } },
    }));
  }, []);

  // Filtered grid rows
  const allRows = Object.values(lines);
  const displayRows = useMemo(() => {
    if (!gridSearch) return allRows;
    const q = gridSearch.toLowerCase();
    return allRows.filter((r) =>
      r.productName.toLowerCase().includes(q) ||
      r.productCode.toLowerCase().includes(q) ||
      r.variant.sku.toLowerCase().includes(q)
    );
  }, [allRows, gridSearch]);

  const activeLines = allRows.filter((l) => l.quantity > 0);
  const totalUnits = activeLines.reduce((s, l) => s + l.quantity, 0);
  const totalCost = activeLines.reduce((s, l) => s + l.quantity * l.price, 0);
  const totalAllocated = activeLines.reduce((s, l) => s + Object.values(l.allocations).reduce((a, b) => a + b, 0), 0);
  const unallocated = totalUnits - totalAllocated;
  const canSubmit = vendorId && poNumber && internalCode && activeLines.length > 0;
  const fullyAllocated = unallocated === 0 && totalUnits > 0;
  const saving = createPO.isPending || updatePO.isPending;
  const saveError = createPO.error || updatePO.error;

  const handleSave = async (saveStatus: string) => {
    if (!canSubmit) return;
    const poLines: POLineInput[] = activeLines.map((l) => ({
      product_variant_id: l.variant.id,
      total_quantity: l.quantity,
      quoted_price: l.price,
      allocations: Object.entries(l.allocations).filter(([, q]) => q > 0).map(([cId, q]) => ({ sales_channel_id: cId, quantity: q })),
    }));

    if (mode === "edit" && existingPO) {
      await updatePO.mutateAsync({
        vendor_id: vendorId, purchase_order_number: poNumber, purchase_order_date: poDate,
        internal_code: internalCode, total_amount: totalCost, status: saveStatus,
        notes: notes || undefined, carrier: carrier || undefined, tracking_number: trackingNumber || undefined,
        lines: poLines,
      });
      router.push(`/${companySlug}/erp/purchase-orders/${existingPO.id}`);
    } else {
      const poId = await createPO.mutateAsync({
        company_id: companyId, vendor_id: vendorId, purchase_order_number: poNumber,
        purchase_order_date: poDate, internal_code: internalCode, total_amount: totalCost,
        status: saveStatus, notes: notes || undefined, carrier: carrier || undefined,
        tracking_number: trackingNumber || undefined, lines: poLines,
      });
      router.push(`/${companySlug}/erp/purchase-orders/${poId}`);
    }
  };

  const vendorName = vendors?.find((v) => v.id === vendorId)?.name;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header bar (Prediko-style) ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5">
        <Link to={`/${companySlug}/erp/purchase-orders${mode === "edit" && existingPO ? `/${existingPO.id}` : ""}`}>
          <Button variant="ghost" size="icon" className="size-7"><IconArrowLeft className="size-3.5" /></Button>
        </Link>

        {/* PO Number */}
        <Input
          className="h-8 w-40 border-dashed text-sm font-semibold"
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
          placeholder="PO Number"
        />

        {/* Vendor select */}
        <div className="flex items-center gap-1">
          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger className="h-8 w-52 border-dashed text-xs">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {(vendors ?? []).map((v) => (<SelectItem key={v.id} value={v.id} className="text-xs">{v.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setVendorSheetOpen(true)}>
            <IconPlus className="size-3" />
          </Button>
        </div>

        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-dashed text-xs" onClick={() => setDetailsSheetOpen(true)}>
          <IconFileText className="size-3" />More details
        </Button>

        {/* Status */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-28 border-dashed text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft" className="text-xs">Draft</SelectItem>
            <SelectItem value="submitted" className="text-xs">Submitted</SelectItem>
            <SelectItem value="closed" className="text-xs">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-5" />

        {/* Delivery date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Delivery date:</span>
          <Input type="date" className="h-8 w-36 border-dashed text-xs" value={poDate} onChange={(e) => setPoDate(e.target.value)} />
        </div>

        {/* Spacer + action buttons */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleSave("draft")} disabled={!canSubmit || saving}>
            <IconDeviceFloppy className="mr-1 size-3" />{saving ? "Saving..." : "Save Draft"}
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={() => handleSave("submitted")} disabled={!canSubmit || !fullyAllocated || saving}>
            <IconSend className="mr-1 size-3" />{saving ? "Saving..." : "Submit PO"}
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="border-b bg-destructive/5 px-4 py-1.5">
          <p className="text-xs text-destructive">{saveError instanceof Error ? saveError.message : "Failed to save"}</p>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs defaultValue="overall" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b px-4">
          <TabsList variant="line" className="h-9">
            <TabsTrigger value="overall" className="text-xs">Overall</TabsTrigger>
            <TabsTrigger value="allocations" className="text-xs">Allocations</TabsTrigger>
          </TabsList>
        </div>

        {/* ── TAB: Overall (the spreadsheet grid) ── */}
        <TabsContent value="overall" className="flex min-h-0 flex-1 flex-col">
          {/* Search / filter bar */}
          <div className="flex items-center justify-between border-b px-4 py-2">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input className="h-8 w-64 pl-8 text-xs" placeholder="Search by Product or SKU" value={gridSearch} onChange={(e) => setGridSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setChannelSheetOpen(true)}>
                <IconPlus className="mr-1 size-3" />Add channel
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={() => { setProductSearch(""); setProductSheetOpen(true); }}>
                <IconPlus className="mr-1 size-3" />Add products
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="min-h-0 flex-1 overflow-auto">
            {allRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <IconPackage className="mb-3 size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Select one or multiple products to start building your order</p>
                <Button size="sm" className="mt-4 h-8 text-xs" onClick={() => setProductSheetOpen(true)}>
                  <IconPlus className="mr-1 size-3" />Add products
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="sticky left-0 z-10 h-8 min-w-[180px] bg-muted/40 px-3 text-[10px] font-semibold uppercase tracking-wider">Products</TableHead>
                    <TableHead className="h-8 min-w-[100px] px-2 text-[10px] font-semibold uppercase tracking-wider">SKU</TableHead>
                    <TableHead className="h-8 w-16 px-2 text-[10px] font-semibold uppercase tracking-wider">Size</TableHead>
                    <TableHead className="h-8 w-20 px-1 text-right text-[10px] font-semibold uppercase tracking-wider">Units</TableHead>
                    <TableHead className="h-8 w-24 px-1 text-right text-[10px] font-semibold uppercase tracking-wider">Unit Cost</TableHead>
                    <TableHead className="h-8 w-24 px-1 text-right text-[10px] font-semibold uppercase tracking-wider">Total Cost</TableHead>
                    {(channels ?? []).map((ch) => (
                      <TableHead key={ch.id} className="h-8 w-20 px-1 text-right text-[10px] font-semibold uppercase tracking-wider">{ch.name}</TableHead>
                    ))}
                    <TableHead className="h-8 w-20 px-1 text-right text-[10px] font-semibold uppercase tracking-wider">Unalloc.</TableHead>
                    <TableHead className="h-8 w-8 px-1" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((line, i) => {
                    const alloc = Object.values(line.allocations).reduce((a, b) => a + b, 0);
                    const rem = line.quantity - alloc;
                    const isFirstOfProduct = i === 0 || displayRows[i - 1].variant.product_id !== line.variant.product_id;
                    const lineTotal = line.quantity * line.price;

                    return (
                      <TableRow key={line.variant.id} className={`hover:bg-accent/30 ${isFirstOfProduct ? "border-t" : ""}`}>
                        <TableCell className="sticky left-0 z-10 bg-background px-3 py-1">
                          {isFirstOfProduct ? (
                            <div>
                              <p className="truncate text-[11px] font-medium">{line.productName}</p>
                              <p className="text-[10px] text-muted-foreground">{line.productCode}</p>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground/50">{line.productName}</p>
                          )}
                        </TableCell>
                        <TableCell className="px-2 py-1 font-mono text-[11px]">{line.variant.sku}</TableCell>
                        <TableCell className="px-2 py-1 text-[11px]">{line.variant.size}</TableCell>
                        <TableCell className="px-1 py-1 text-right">
                          <Input type="number" min={0} value={line.quantity || ""} onChange={(e) => updateQty(line.variant.id, parseInt(e.target.value) || 0)} className="ml-auto h-6 w-16 border-transparent bg-transparent text-right text-[11px] hover:border-input focus:border-input" />
                        </TableCell>
                        <TableCell className="px-1 py-1 text-right">
                          <Input type="number" min={0} step={0.01} value={line.price || ""} onChange={(e) => updatePrice(line.variant.id, parseFloat(e.target.value) || 0)} className="ml-auto h-6 w-20 border-transparent bg-transparent text-right text-[11px] hover:border-input focus:border-input" />
                        </TableCell>
                        <TableCell className="px-1 py-1 text-right text-[11px] tabular-nums">
                          {lineTotal > 0 ? `$${lineTotal.toLocaleString()}` : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        {(channels ?? []).map((ch) => (
                          <TableCell key={ch.id} className="px-1 py-1 text-right">
                            {line.quantity > 0 ? (
                              <Input type="number" min={0} value={line.allocations[ch.id] || ""} onChange={(e) => updateAlloc(line.variant.id, ch.id, parseInt(e.target.value) || 0)} className="ml-auto h-6 w-16 border-transparent bg-transparent text-right text-[11px] hover:border-input focus:border-input" />
                            ) : <span className="text-[10px] text-muted-foreground">—</span>}
                          </TableCell>
                        ))}
                        <TableCell className="px-1 py-1 text-right">
                          {line.quantity > 0 ? (
                            <span className={`text-[11px] font-medium tabular-nums ${rem === 0 ? "text-green-600" : rem < 0 ? "text-destructive" : "text-amber-600"}`}>{rem}</span>
                          ) : <span className="text-[10px] text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="px-1 py-1">
                          {isFirstOfProduct && (
                            <Button variant="ghost" size="icon" className="size-5" onClick={() => removeProduct(line.variant.product_id)}>
                              <IconTrash className="size-3 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* ── TAB: Allocations summary ── */}
        <TabsContent value="allocations" className="flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            {(channels ?? []).length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No sales channels configured.</p>
                <Button size="sm" className="mt-3 h-8 text-xs" onClick={() => setChannelSheetOpen(true)}><IconPlus className="mr-1 size-3" />Add channel</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-8 text-[10px] font-semibold uppercase tracking-wider">Product</TableHead>
                    <TableHead className="h-8 text-[10px] font-semibold uppercase tracking-wider">SKU</TableHead>
                    <TableHead className="h-8 text-[10px] font-semibold uppercase tracking-wider">Size</TableHead>
                    <TableHead className="h-8 text-right text-[10px] font-semibold uppercase tracking-wider">Ordered</TableHead>
                    {(channels ?? []).map((ch) => (
                      <TableHead key={ch.id} className="h-8 text-right text-[10px] font-semibold uppercase tracking-wider">{ch.name}</TableHead>
                    ))}
                    <TableHead className="h-8 text-right text-[10px] font-semibold uppercase tracking-wider">Remaining</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeLines.map((line) => {
                    const alloc = Object.values(line.allocations).reduce((a, b) => a + b, 0);
                    return (
                      <TableRow key={line.variant.id}>
                        <TableCell className="py-1.5 text-[11px]">{line.productName}</TableCell>
                        <TableCell className="py-1.5 font-mono text-[11px]">{line.variant.sku}</TableCell>
                        <TableCell className="py-1.5 text-[11px]">{line.variant.size}</TableCell>
                        <TableCell className="py-1.5 text-right text-[11px] tabular-nums">{line.quantity}</TableCell>
                        {(channels ?? []).map((ch) => (
                          <TableCell key={ch.id} className="py-1.5 text-right text-[11px] tabular-nums">{line.allocations[ch.id] || 0}</TableCell>
                        ))}
                        <TableCell className="py-1.5 text-right">
                          <span className={`text-[11px] font-medium tabular-nums ${line.quantity - alloc === 0 ? "text-green-600" : "text-amber-600"}`}>
                            {line.quantity - alloc}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {activeLines.length === 0 && (
                    <TableRow><TableCell colSpan={99} className="py-8 text-center text-xs text-muted-foreground">No lines with quantities yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Sticky bottom bar (Prediko-style) ── */}
      {allRows.length > 0 && (
        <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total order units:</span>
              <span className="text-xs font-semibold tabular-nums">{totalUnits.toLocaleString()}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total product cost:</span>
              <span className="text-xs font-semibold tabular-nums">${totalCost.toLocaleString()}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Allocated:</span>
              <span className={`text-xs font-semibold tabular-nums ${fullyAllocated ? "text-green-600" : totalAllocated > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                {totalAllocated}/{totalUnits}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total order cost:</span>
            <span className="text-sm font-bold tabular-nums">${totalCost.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* ── SHEET: More Details ── */}
      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-sm">Order Details</SheetTitle>
            <SheetDescription className="text-xs">Additional fields for this purchase order.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4">
            <div className="space-y-1"><Label className="text-xs">Internal Code *</Label><Input className="h-8 text-xs" value={internalCode} onChange={(e) => setInternalCode(e.target.value)} placeholder="INT-001" /></div>
            <div className="space-y-1"><Label className="text-xs">Carrier</Label><Input className="h-8 text-xs" value={carrier} onChange={(e) => setCarrier(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Tracking #</Label><Input className="h-8 text-xs" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">Notes</Label><Input className="h-8 text-xs" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
          </div>
          <SheetFooter><Button size="sm" className="h-8 text-xs" onClick={() => setDetailsSheetOpen(false)}>Done</Button></SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: Add Vendor ── */}
      <Sheet open={vendorSheetOpen} onOpenChange={setVendorSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="text-sm">New Vendor</SheetTitle></SheetHeader>
          <div className="grid gap-3 px-4">
            <div className="space-y-1"><Label className="text-xs">Name *</Label><Input className="h-8 text-xs" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Category *</Label>
              <Select value={newVendor.category_id} onValueChange={(v) => setNewVendor({ ...newVendor, category_id: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(vendorCategories ?? []).map((c) => (<SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" className="h-8 text-xs" disabled={!newVendor.name || !newVendor.category_id || createVendor.isPending} onClick={async () => {
              const v = await createVendor.mutateAsync({ company_id: companyId, name: newVendor.name, category_id: newVendor.category_id });
              setVendorId(v.id); setNewVendor({ name: "", category_id: "" }); setVendorSheetOpen(false);
            }}>{createVendor.isPending ? "Creating..." : "Create Vendor"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: Add Channel ── */}
      <Sheet open={channelSheetOpen} onOpenChange={setChannelSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader><SheetTitle className="text-sm">New Sales Channel</SheetTitle></SheetHeader>
          <div className="grid gap-3 px-4">
            <div className="space-y-1"><Label className="text-xs">Name *</Label><Input className="h-8 text-xs" value={newChannel.name} onChange={(e) => setNewChannel({ ...newChannel, name: e.target.value })} /></div>
            <div className="space-y-1">
              <Label className="text-xs">Category *</Label>
              <Select value={newChannel.category_id} onValueChange={(v) => setNewChannel({ ...newChannel, category_id: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{(channelCategories ?? []).map((c) => (<SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" className="h-8 text-xs" disabled={!newChannel.name || !newChannel.category_id || createChannel.isPending} onClick={async () => {
              await createChannel.mutateAsync({ name: newChannel.name, category_id: newChannel.category_id });
              setNewChannel({ name: "", category_id: "" }); setChannelSheetOpen(false);
            }}>{createChannel.isPending ? "Creating..." : "Create Channel"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── SHEET: Add Product ── */}
      <Sheet open={productSheetOpen} onOpenChange={setProductSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-sm">Add Products</SheetTitle>
            <SheetDescription className="text-xs">Search by name or product code.</SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
              <Input className="h-8 pl-8 text-xs" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} autoFocus />
            </div>
          </div>
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-4 pt-2">
            {filteredProducts.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">{productSearch.length < 2 ? "Type at least 2 characters..." : "No products found."}</p>
            ) : filteredProducts.map((p) => (
              <button key={p.id} onClick={() => addProduct(p)} className="flex w-full items-center justify-between rounded px-2.5 py-2 text-left hover:bg-accent">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.internal_product_code ?? "—"} · {p.variants.length} variants</p>
                </div>
                <IconPlus className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
