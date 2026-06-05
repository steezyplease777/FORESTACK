// @ts-nocheck

import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";

const routeApi = getRouteApi("/$companySlug/erp/vendors");
import {
  useVendors,
  useVendorCategories,
  useCreateVendor,
  useCreateVendorCategory,
} from "@/lib/data/erp/vendors/hooks";
import type { VendorWithCategory } from "@/lib/data/erp/vendors/client";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VendorTable } from "@/features/company/modules/erp/vendors/vendor-table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogBody, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { IconPlus, IconSearch } from "@tabler/icons-react";

export function VendorsPage() {
  const { company } = useCompany();
  const companyId = company?.companyId ?? "";
  const { data: vendors, isLoading } = useVendors(companyId);
  const { data: categories } = useVendorCategories(companyId);
  const createVendor = useCreateVendor(companyId);
  const createCategory = useCreateVendorCategory(companyId);

  const { q: search, detail: detailId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const setSearch = (q: string) =>
    navigate({ search: (prev) => ({ ...prev, q }) });
  const detailVendor = detailId
    ? (vendors ?? []).find((v) => v.id === detailId) ?? null
    : null;
  const setDetailVendor = (v: VendorWithCategory | null) =>
    navigate({ search: (prev) => ({ ...prev, detail: v?.id }) });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", category_id: "", contact_name: "", contact_email: "", contact_phone: "", website_url: "",
  });
  const [newCatName, setNewCatName] = useState("");

  const filtered = (vendors ?? []).filter((v) =>
    !search ||
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.contact_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (v.category?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleCreate = async () => {
    if (!form.name || !form.category_id) return;
    await createVendor.mutateAsync({
      company_id: companyId,
      name: form.name,
      category_id: form.category_id,
      contact_name: form.contact_name || undefined,
      contact_email: form.contact_email || undefined,
      contact_phone: form.contact_phone || undefined,
      website_url: form.website_url || undefined,
    });
    setForm({ name: "", category_id: "", contact_name: "", contact_email: "", contact_phone: "", website_url: "" });
    setSheetOpen(false);
  };

  const actions = (
    <Button size="sm" onClick={() => setSheetOpen(true)}>
      <IconPlus className="mr-1 size-4" />
      Add Vendor
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description={`${vendors?.length ?? 0} vendors`}
        actions={actions}
      />

      <Card>
        <CardHeader>
          <CardTitle>All vendors</CardTitle>
          <CardDescription>
            {filtered.length} vendor{filtered.length !== 1 ? "s" : ""}
          </CardDescription>
          <CardAction>
            <div className="relative">
              <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 w-56 pl-8"
                placeholder="Search vendors…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No vendors found"
              description={search ? "Try a different search." : "Add your first vendor."}
            />
          ) : (
            <VendorTable
              vendors={filtered}
              onRowClick={setDetailVendor}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Vendor Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Vendor</SheetTitle>
            <SheetDescription>Add a new vendor to your company.</SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 px-4">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Category *</Label>
              <div className="flex gap-1.5">
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{(categories ?? []).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="shrink-0" onClick={() => setCatDialogOpen(true)}>
                  <IconPlus className="size-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Contact</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Website</Label><Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} /></div>
            </div>
          </div>
          <SheetFooter>
            <Button size="sm" onClick={handleCreate} disabled={!form.name || !form.category_id || createVendor.isPending}>
              {createVendor.isPending ? "Creating…" : "Create Vendor"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Vendor Detail Sheet */}
      <Sheet open={!!detailVendor} onOpenChange={(o) => !o && setDetailVendor(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {detailVendor && (
            <>
              <SheetHeader>
                <SheetTitle>{detailVendor.name}</SheetTitle>
                <SheetDescription>
                  {detailVendor.category?.name ?? "No category"} · Added{" "}
                  {new Date(detailVendor.created_at).toLocaleDateString()}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 px-4 text-sm">
                {[
                  { label: "Contact", value: detailVendor.contact_name },
                  { label: "Email", value: detailVendor.contact_email },
                  { label: "Phone", value: detailVendor.contact_phone },
                  {
                    label: "Address",
                    value:
                      [
                        detailVendor.contact_address,
                        detailVendor.contact_city,
                        detailVendor.contact_state,
                        detailVendor.contact_zip,
                      ]
                        .filter(Boolean)
                        .join(", ") || null,
                  },
                  { label: "Website", value: detailVendor.website_url },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {label}
                    </p>
                    <p>{value || "—"}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Category dialog */}
      {catDialogOpen && (
        <Dialog>
          <DialogHeader title="New Category" />
          <DialogBody>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              size="sm"
              onClick={async () => {
                if (!newCatName) return;
                await createCategory.mutateAsync({ company_id: companyId, name: newCatName });
                setNewCatName("");
                setCatDialogOpen(false);
              }}
              disabled={!newCatName || createCategory.isPending}
            >
              {createCategory.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
