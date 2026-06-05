// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconBoxMultiple,
  IconCalendar,
  IconCheck,
  IconCube,
  IconDeviceFloppy,
  IconEdit,
  IconPlus,
  IconTrash,
  IconTruckDelivery,
  IconX,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

import {
  useDeletePlmProduct,
  usePlmProductDetail,
  useUpdatePlmProduct,
} from "@/lib/data/plm/products/hooks";
import { usePlmSourcingByStyle } from "@/lib/data/plm/sourcing/hooks";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/products/$productId",
);

type EditablePatch = {
  name: string;
  internal_product_code: string;
  msrp: string;
  retail_description: string;
  seo_description: string;
};

export function PlmProductDetailPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { productId } = routeApi.useParams();
  const navigate = useNavigate();

  const productQuery = usePlmProductDetail(companyId, productId);
  const updateProduct = useUpdatePlmProduct(companyId, companySlug);
  const deleteProduct = useDeletePlmProduct(companyId, companySlug);

  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const product = productQuery.data;

  // Seed the edit form from the latest server copy when edit mode opens
  // or the product changes under us (e.g. another tab mutated it).
  const initialPatch = React.useMemo<EditablePatch>(
    () => ({
      name: product?.name ?? "",
      internal_product_code: product?.internal_product_code ?? "",
      msrp: product?.msrp != null ? String(product.msrp) : "",
      retail_description: product?.retail_description ?? "",
      seo_description: product?.seo_description ?? "",
    }),
    [product],
  );
  const [patch, setPatch] = React.useState<EditablePatch>(initialPatch);
  React.useEffect(() => {
    if (!isEditing) setPatch(initialPatch);
  }, [initialPatch, isEditing]);

  const handleSave = async () => {
    if (!product) return;
    const msrpNum = patch.msrp.trim() === "" ? null : Number(patch.msrp);
    if (msrpNum != null && Number.isNaN(msrpNum)) {
      toast.error("MSRP must be a number");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        name: patch.name.trim() || product.name,
        internal_product_code:
          patch.internal_product_code.trim() === ""
            ? null
            : patch.internal_product_code.trim(),
        msrp: msrpNum,
        retail_description:
          patch.retail_description.trim() === ""
            ? null
            : patch.retail_description.trim(),
        seo_description:
          patch.seo_description.trim() === ""
            ? null
            : patch.seo_description.trim(),
      });
      toast.success("Product updated");
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  if (productQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Button variant="ghost" size="sm" asChild className="self-start">
          <Link to={`${basePath}/plm/products`}>
            <IconArrowLeft className="size-4" />
            Back to Products
          </Link>
        </Button>
        <div className="rounded-md border bg-muted/30 p-6">
          <h2 className="text-base font-semibold">Product not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This product may have been deleted. Return to the list to pick
            another.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={`${basePath}/plm/products`}>
            <IconArrowLeft className="size-4" />
            Back to Products
          </Link>
        </Button>
        <PageHeader
          title={product.name}
          description={
            <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {product.style ? (
                <Badge variant="outline" className="font-mono">
                  {product.style.style_number}
                </Badge>
              ) : null}
              {product.internal_product_code ? (
                <span className="font-mono text-xs">
                  {product.internal_product_code}
                </span>
              ) : null}
              {product.campaign ? (
                <span className="inline-flex items-center gap-1">
                  <IconCalendar className="size-3.5" />
                  {product.campaign.name}
                </span>
              ) : null}
            </span>
          }
          actions={
            !isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <IconEdit className="size-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                >
                  <IconTrash className="size-4" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateProduct.isPending}
                  onClick={() => setIsEditing(false)}
                >
                  <IconX className="size-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updateProduct.isPending}
                  onClick={handleSave}
                >
                  <IconDeviceFloppy className="size-4" />
                  {updateProduct.isPending ? "Saving…" : "Save"}
                </Button>
              </>
            )
          }
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <IconCube className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="variants">
            <IconBoxMultiple className="size-4" />
            Variants ({product.variants?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="sourcing">
            <IconTruckDelivery className="size-4" />
            Sourcing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {isEditing ? (
            <ProductEditForm patch={patch} onChange={setPatch} />
          ) : (
            <ProductOverview product={product} />
          )}
        </TabsContent>

        <TabsContent value="variants" className="mt-4">
          <VariantsTab product={product} />
        </TabsContent>

        <TabsContent value="sourcing" className="mt-4">
          <SourcingTab
            product={product}
            companyId={companyId}
            companySlug={companySlug}
            onChangeSourcing={async (sourcingId) => {
              await updateProduct.mutateAsync({
                id: product.id,
                sourcing_id: sourcingId,
              });
              toast.success(
                sourcingId ? "Linked sourcing" : "Unlinked sourcing",
              );
            }}
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${product.name}?`}
        description="This permanently removes the product and all its variants."
        confirmText={deleteProduct.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          await deleteProduct.mutateAsync({ id: product.id });
          setDeleteOpen(false);
          navigate({ to: `${basePath}/plm/products` });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function ProductOverview({
  product,
}: {
  product: NonNullable<ReturnType<typeof usePlmProductDetail>["data"]>;
}) {
  // Overview tab mirrors the Variants / Sourcing tabs: two cards so
  // flipping between tabs doesn't feel like switching between flat
  // sections and boxed panels. Identity + References merge into one
  // "Product info" card (all quick-lookup facts), and the longer
  // marketing copy gets its own "Descriptions" card.
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Product info</CardTitle>
          <CardDescription>
            Identity, pricing, and references to the linked style, colorway,
            and campaign.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" value={product.name} />
            <Field
              label="Internal code"
              value={product.internal_product_code ?? "—"}
              mono
            />
            <Field
              label="MSRP"
              value={
                product.msrp != null
                  ? `$${Number(product.msrp).toFixed(2)}`
                  : "—"
              }
            />
            <Field
              label="Style"
              value={
                product.style
                  ? `${product.style.style_number}${
                      product.style.style_name
                        ? ` — ${product.style.style_name}`
                        : ""
                    }`
                  : "—"
              }
            />
            <Field
              label="Colorway"
              value={
                product.colorway
                  ? `${product.colorway.name}${
                      product.colorway.colorway_code
                        ? ` (${product.colorway.colorway_code})`
                        : ""
                    }`
                  : "—"
              }
            />
            <Field label="Campaign" value={product.campaign?.name ?? "—"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descriptions</CardTitle>
          <CardDescription>
            Retail and SEO copy override any style-level defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-0">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Retail
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {product.retail_description ?? (
                <span className="text-muted-foreground">
                  No retail description yet.
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              SEO
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {product.seo_description ?? (
                <span className="text-muted-foreground">
                  No SEO description yet.
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductEditForm({
  patch,
  onChange,
}: {
  patch: EditablePatch;
  onChange: (next: EditablePatch) => void;
}) {
  const set = <K extends keyof EditablePatch>(key: K, value: string) =>
    onChange({ ...patch, [key]: value });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit product</CardTitle>
        <CardDescription>
          Style, colorway, and campaign can't be changed here — create a new
          product instead.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Name</Label>
            <Input
              id="prod-name"
              value={patch.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-code">Internal product code</Label>
            <Input
              id="prod-code"
              value={patch.internal_product_code}
              onChange={(e) => set("internal_product_code", e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-msrp">MSRP (USD)</Label>
            <Input
              id="prod-msrp"
              type="number"
              step="0.01"
              min="0"
              value={patch.msrp}
              onChange={(e) => set("msrp", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="prod-retail">Retail description</Label>
            <Textarea
              id="prod-retail"
              rows={3}
              value={patch.retail_description}
              onChange={(e) => set("retail_description", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="prod-seo">SEO description</Label>
            <Textarea
              id="prod-seo"
              rows={3}
              value={patch.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VariantsTab({
  product,
}: {
  product: NonNullable<ReturnType<typeof usePlmProductDetail>["data"]>;
}) {
  const variants = product.variants ?? [];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBoxMultiple className="size-4 text-muted-foreground" />
          Variants
        </CardTitle>
        <CardDescription>
          Size-level SKUs for this product — managed at the style level.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {variants.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No variants yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>UPC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {v.size}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {v.upc ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SourcingTab({
  product,
  companyId,
  companySlug,
  onChangeSourcing,
}: {
  product: NonNullable<ReturnType<typeof usePlmProductDetail>["data"]>;
  companyId: string;
  companySlug: string;
  onChangeSourcing: (sourcingId: string | null) => void | Promise<void>;
}) {
  const basePath = `/${companySlug}`;
  const optionsQuery = usePlmSourcingByStyle(companyId, product.style_id);
  const options = optionsQuery.data ?? [];

  const currentId = product.sourcing_id ?? null;
  const [draftId, setDraftId] = React.useState<string | null>(currentId);
  React.useEffect(() => setDraftId(currentId), [currentId]);

  const hasChanges = draftId !== currentId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTruckDelivery className="size-4 text-muted-foreground" />
          Linked sourcing
        </CardTitle>
        <CardDescription>
          The sourcing row used for costing. Pick any row attached to style{" "}
          <span className="font-mono">
            {product.style?.style_number ?? "—"}
          </span>
          .
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link
              to={`${basePath}/plm/sourcing/new`}
              search={{ styleId: product.style_id }}
            >
              <IconPlus className="size-4" />
              Add sourcing
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {product.sourcing ? (
          <div className="rounded-md border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {product.sourcing.vendor?.name ?? "Unknown vendor"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Linked on{" "}
                    {new Date(product.sourcing.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    to={`${basePath}/plm/sourcing/${product.sourcing.id}`}
                  >
                    Open
                  </Link>
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                <Stat
                  label="COG"
                  value={
                    product.sourcing.cog != null
                      ? `$${Number(product.sourcing.cog).toFixed(2)}`
                      : "—"
                  }
                />
                <Stat
                  label="HS tariff"
                  value={product.sourcing.hs_tariff_code ?? "—"}
                  mono
                />
                <Stat
                  label="Weight"
                  value={
                    product.sourcing.weight != null
                      ? `${product.sourcing.weight}`
                      : "—"
                  }
                />
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No sourcing linked. Pick one below or create a new sourcing row.
            </p>
          )}

          <div className="space-y-2">
            <Label>Change sourcing</Label>
            {optionsQuery.isLoading ? (
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            ) : options.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sourcing rows exist for this style yet.{" "}
                <Link
                  to={`${basePath}/plm/sourcing/new`}
                  search={{ styleId: product.style_id }}
                  className="text-primary hover:underline"
                >
                  Create one
                </Link>
                .
              </p>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={draftId ?? "__none__"}
                  onValueChange={(v) =>
                    setDraftId(v === "__none__" ? null : v)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pick a sourcing record…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Unlinked —</SelectItem>
                    {options.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.vendor?.name ?? "Unknown vendor"}
                        {s.cog != null
                          ? ` · $${Number(s.cog).toFixed(2)}`
                          : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  disabled={!hasChanges}
                  onClick={() => onChangeSourcing(draftId)}
                >
                  <IconCheck className="size-4" />
                  Apply
                </Button>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "font-mono text-sm" : "text-sm"}>{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "font-mono text-sm tabular-nums" : "text-sm tabular-nums"}>
        {value}
      </p>
    </div>
  );
}
