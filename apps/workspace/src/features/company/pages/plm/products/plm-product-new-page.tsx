// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconCube,
  IconLoader2,
  IconRoute,
  IconShoppingBag,
  IconTag,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { useCampaigns, useCampaign } from "@/lib/data/pm/campaigns/hooks";
import {
  useCreatePlmStyle,
  usePlmStyles,
} from "@/lib/data/plm/styles/hooks";
import { usePlmProductCategories } from "@/lib/data/plm/categories/hooks";
import { useVendors } from "@/lib/data/erp/vendors/hooks";
import { useCreatePlmProduct } from "@/lib/data/plm/products/hooks";
import { useCreatePlmSourcing } from "@/lib/data/plm/sourcing/hooks";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/products/new",
);

type Mode = "with_style" | "without_style";

/**
 * Product creation state, flat across both paths. Unused fields for a
 * given mode are simply ignored at submit time — keeping one shape
 * means we can freely bounce the user between modes (via the back
 * button) without losing anything they already entered.
 */
type FormState = {
  // Style — only used in `with_style`
  style_number: string;
  style_name: string;
  style_description: string;
  style_category_id: string;
  style_gender: "" | "WOMENS" | "MENS" | "UNISEX";

  // Sourcing — only used in `with_style`
  vendor_id: string;
  cog: string;
  hs_tariff_code: string;
  weight: string;

  // Product
  name: string;
  // In `without_style` this is an OPTIONAL picker over existing styles.
  // In `with_style` this is populated from the freshly-created style
  // after submit.
  existing_style_id: string;
  campaign_id: string;
  colorway_id: string;
  internal_product_code: string;
  msrp: string;
  retail_description: string;
  seo_description: string;
};

const EMPTY_FORM: FormState = {
  style_number: "",
  style_name: "",
  style_description: "",
  style_category_id: "",
  style_gender: "",
  vendor_id: "",
  cog: "",
  hs_tariff_code: "",
  weight: "",
  name: "",
  existing_style_id: "",
  campaign_id: "",
  colorway_id: "",
  internal_product_code: "",
  msrp: "",
  retail_description: "",
  seo_description: "",
};

type StepDef = { id: number; label: string; description: string };

const STEPS_WITH_STYLE: StepDef[] = [
  { id: 1, label: "Style", description: "New style number + category." },
  {
    id: 2,
    label: "Sourcing",
    description: "Vendor, COG, tariff, weight.",
  },
  {
    id: 3,
    label: "Product",
    description: "Name, campaign, colorway, MSRP.",
  },
  { id: 4, label: "Review", description: "Confirm and create." },
];

const STEPS_WITHOUT_STYLE: StepDef[] = [
  {
    id: 1,
    label: "Product",
    description: "Name, campaign, colorway, MSRP.",
  },
  {
    id: 2,
    label: "Details",
    description: "Descriptions and optional style link.",
  },
  { id: 3, label: "Review", description: "Confirm and create." },
];

export function PlmProductNewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;
  const productsHref = `${basePath}/plm/products`;

  const { mode, step: stepFromUrl } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  // Mutations — all three wizards may or may not fire these in sequence.
  const createStyle = useCreatePlmStyle(companyId, companySlug);
  const createSourcing = useCreatePlmSourcing(companyId, companySlug);
  const createProduct = useCreatePlmProduct(companyId, companySlug);

  // Dropdown data
  const stylesQuery = usePlmStyles(companyId);
  const campaignsQuery = useCampaigns(companyId, { page: 1, pageSize: 200 });
  const categoriesQuery = usePlmProductCategories(companyId);
  const vendorsQuery = useVendors(companyId);

  const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Reset colorway when the campaign changes — the colorway list is
  // campaign-scoped and a stale pick from a previous campaign would
  // silently fail RLS at insert time.
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "campaign_id") next.colorway_id = "";
      return next;
    });
  };

  const campaignDetail = useCampaign(companyId, form.campaign_id);
  const colorways = campaignDetail.data?.colorways ?? [];

  const steps: StepDef[] | null =
    mode === "with_style"
      ? STEPS_WITH_STYLE
      : mode === "without_style"
        ? STEPS_WITHOUT_STYLE
        : null;
  const step = Math.max(1, stepFromUrl ?? 1);
  const totalSteps = steps?.length ?? 0;

  // ---- Guards per step (used for forward navigation + submit) ------
  const canAdvanceFrom = (id: number): boolean => {
    if (mode === "with_style") {
      if (id === 1) return form.style_number.trim().length > 0;
      if (id === 2) return !!form.vendor_id;
      if (id === 3)
        return (
          form.name.trim().length > 0 &&
          !!form.campaign_id &&
          !!form.colorway_id
        );
      return true;
    }
    if (mode === "without_style") {
      if (id === 1)
        return (
          form.name.trim().length > 0 &&
          !!form.campaign_id &&
          !!form.colorway_id
        );
      if (id === 2) return true;
      return true;
    }
    return false;
  };

  const allPriorStepsValid = (target: number): boolean => {
    for (let i = 1; i < target; i++) if (!canAdvanceFrom(i)) return false;
    return true;
  };

  const goToStep = (next: number) => {
    if (next < 1) return;
    if (steps && next > totalSteps) return;
    if (next > step && !allPriorStepsValid(next)) return;
    navigate({ search: (prev) => ({ ...prev, step: next }), replace: false });
  };

  const handleNext = () => {
    if (!canAdvanceFrom(step)) return;
    if (step < totalSteps) goToStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) return;
    goToStep(step - 1);
  };

  const pickMode = (chosen: Mode) => {
    navigate({
      search: (prev) => ({ ...prev, mode: chosen, step: 1 }),
      replace: false,
    });
  };

  // ---- Submission ---------------------------------------------------
  // Both paths converge at `createProduct`. The `with_style` path
  // chains three inserts: style → sourcing → product. We do NOT use a
  // transaction (Supabase JS doesn't expose one for this RLS layer);
  // instead we short-circuit on failure and surface the error. The
  // worst case is a dangling style/sourcing row, which is recoverable
  // from the UI. An Edge Function would be cleaner long-term.
  const submitting =
    createStyle.isPending ||
    createSourcing.isPending ||
    createProduct.isPending;

  const handleSubmit = async () => {
    if (!mode) return;
    if (!allPriorStepsValid(totalSteps + 1)) {
      const firstInvalid = [...Array(totalSteps)]
        .map((_, i) => i + 1)
        .find((id) => !canAdvanceFrom(id));
      if (firstInvalid) goToStep(firstInvalid);
      return;
    }

    setSubmitError(null);
    try {
      const msrp = parseNullableNumber(form.msrp, "MSRP");

      let styleId: string | null = null;
      let sourcingId: string | null = null;

      if (mode === "with_style") {
        const style = await createStyle.mutateAsync({
          company_id: companyId,
          style_number: form.style_number.trim(),
          style_name: form.style_name.trim() || null,
          description: form.style_description.trim() || null,
          category_id: form.style_category_id || null,
          gender: form.style_gender || null,
        });
        styleId = style.id;

        // Vendor is required for a sourcing row; we already guarded on
        // step 2, but defensive-check in case the form gets tampered
        // with via URL manipulation.
        if (form.vendor_id) {
          const sourcing = await createSourcing.mutateAsync({
            company_id: companyId,
            style_id: styleId,
            vendor_id: form.vendor_id,
            cog: parseNullableNumber(form.cog, "COG"),
            hs_tariff_code: form.hs_tariff_code.trim() || null,
            weight: parseNullableNumber(form.weight, "Weight"),
          });
          sourcingId = sourcing.id;
        }
      } else {
        // In `without_style`, the picker is optional. Empty string =>
        // null style_id on the product.
        styleId = form.existing_style_id || null;
      }

      const product = await createProduct.mutateAsync({
        company_id: companyId,
        name: form.name.trim(),
        style_id: styleId,
        campaign_id: form.campaign_id,
        colorway_id: form.colorway_id,
        sourcing_id: sourcingId,
        internal_product_code: form.internal_product_code.trim() || null,
        msrp,
        retail_description: form.retail_description.trim() || null,
        seo_description: form.seo_description.trim() || null,
      });

      toast.success("Product created");
      navigate({
        to: `${basePath}/plm/products/${product.id}`,
        replace: true,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Couldn't create product.";
      setSubmitError(message);
      toast.error(message);
    }
  };

  // -------------------- Mode selection screen ----------------------
  if (!mode || !steps) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          eyebrow="Product lifecycle"
          title="New product"
          description="Products link a style + colorway + campaign. Pick the path that fits what you already have."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link to={productsHref}>Cancel</Link>
            </Button>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <ModeCard
            title="With a new style number"
            description="You're introducing a brand-new silhouette. We'll walk you through the style, its sourcing, and the product in that order."
            accent="ring-primary/40 hover:bg-primary/5"
            icon={<IconTag className="size-5" />}
            steps={[
              "Style: style number, name, category, gender",
              "Sourcing: vendor, COG, HS tariff, weight",
              "Product: name, campaign, colorway, MSRP",
            ]}
            onClick={() => pickMode("with_style")}
          />
          <ModeCard
            title="Without a new style number"
            description="The style already exists (or doesn't need one yet). You'll go straight to product details — linking a style is optional and can be added later."
            accent="hover:bg-muted/40"
            icon={<IconShoppingBag className="size-5" />}
            steps={[
              "Product: name, campaign, colorway, MSRP",
              "Details: descriptions, optional style link",
            ]}
            onClick={() => pickMode("without_style")}
          />
        </div>
      </div>
    );
  }

  // ----------------------- Wizard frame ---------------------------
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        eyebrow="Product lifecycle"
        title="New product"
        description={
          mode === "with_style"
            ? "Creating a new style, its sourcing, and the product in one pass."
            : "Product-only creation. Style link is optional on this path."
        }
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 font-normal">
              <IconRoute className="size-3.5" />
              {mode === "with_style"
                ? "With new style"
                : "Without new style"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, mode: undefined, step: undefined }),
                  replace: true,
                })
              }
              disabled={submitting}
            >
              Change path
            </Button>
          </div>
        }
      />

      <Stepper
        steps={steps}
        step={step}
        canAdvanceFrom={canAdvanceFrom}
        onSelect={goToStep}
      />

      <section>
        <header className="mb-4">
          <h2 className="text-base font-semibold">
            {steps[step - 1].label}
          </h2>
          <p className="text-sm text-muted-foreground">
            {steps[step - 1].description}
          </p>
        </header>
        <div>
          {mode === "with_style" ? (
            step === 1 ? (
              <StyleStep
                form={form}
                setField={setField}
                categories={categoriesQuery.data ?? []}
              />
            ) : step === 2 ? (
              <SourcingStep
                form={form}
                setField={setField}
                vendors={vendorsQuery.data ?? []}
                vendorsLoading={vendorsQuery.isLoading}
              />
            ) : step === 3 ? (
              <ProductStep
                form={form}
                setField={setField}
                campaigns={campaignsQuery.data?.rows ?? []}
                campaignsLoading={campaignsQuery.isLoading}
                colorways={colorways}
                colorwaysLoading={campaignDetail.isLoading}
                // Style is being created in this flow — hide the picker
                // and show a read-only reminder instead.
                lockedStylePreview={
                  form.style_number
                    ? `${form.style_number}${
                        form.style_name ? ` — ${form.style_name}` : ""
                      }`
                    : null
                }
              />
            ) : (
              <ReviewStep
                mode={mode}
                form={form}
                styles={stylesQuery.data ?? []}
                campaigns={campaignsQuery.data?.rows ?? []}
                colorways={colorways}
                vendors={vendorsQuery.data ?? []}
                categories={categoriesQuery.data ?? []}
                error={submitError}
              />
            )
          ) : step === 1 ? (
            <ProductStep
              form={form}
              setField={setField}
              campaigns={campaignsQuery.data?.rows ?? []}
              campaignsLoading={campaignsQuery.isLoading}
              colorways={colorways}
              colorwaysLoading={campaignDetail.isLoading}
            />
          ) : step === 2 ? (
            <DetailsStep
              form={form}
              setField={setField}
              styles={stylesQuery.data ?? []}
              stylesLoading={stylesQuery.isLoading}
            />
          ) : (
            <ReviewStep
              mode={mode}
              form={form}
              styles={stylesQuery.data ?? []}
              campaigns={campaignsQuery.data?.rows ?? []}
              colorways={colorways}
              vendors={vendorsQuery.data ?? []}
              categories={categoriesQuery.data ?? []}
              error={submitError}
            />
          )}
        </div>
      </section>

      <div className="flex items-center justify-between gap-2">
        {step === 1 ? (
          <Button variant="ghost" size="sm" asChild disabled={submitting}>
            <Link to={productsHref}>
              <IconArrowLeft className="size-4" />
              Back to products
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBack}
            disabled={submitting}
          >
            <IconArrowLeft className="size-4" />
            Back
          </Button>
        )}

        {step < totalSteps ? (
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!canAdvanceFrom(step)}
          >
            Continue
            <IconArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !allPriorStepsValid(totalSteps + 1)}
          >
            {submitting ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconCheck className="size-4" />
            )}
            {submitting ? "Creating…" : "Create product"}
          </Button>
        )}
      </div>
    </div>
  );
}

function parseNullableNumber(raw: string, label: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (Number.isNaN(n)) throw new Error(`${label} must be a number`);
  return n;
}

// ---------------------------------------------------------------
// Mode card
// ---------------------------------------------------------------

function ModeCard({
  title,
  description,
  icon,
  steps,
  accent,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  steps: string[];
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border bg-card p-5 transition-all",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "hover:shadow-sm",
        accent,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </span>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      <ol className="mt-4 space-y-1.5">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex items-start gap-2 text-sm text-muted-foreground"
          >
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border bg-muted/60 text-[10px] font-semibold tabular-nums text-foreground/70">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </button>
  );
}

// ---------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------

function Stepper({
  steps,
  step,
  canAdvanceFrom,
  onSelect,
}: {
  steps: StepDef[];
  step: number;
  canAdvanceFrom: (id: number) => boolean;
  onSelect: (next: number) => void;
}) {
  return (
    <ol className="flex w-full items-center gap-2">
      {steps.map((s, idx) => {
        const isCurrent = s.id === step;
        const isComplete = s.id < step;
        const isReachable =
          s.id < step ||
          s.id === step ||
          steps.slice(0, s.id - 1).every((prev) => canAdvanceFrom(prev.id));
        const isLast = idx === steps.length - 1;
        return (
          <React.Fragment key={s.id}>
            <li>
              <button
                type="button"
                onClick={() => isReachable && onSelect(s.id)}
                disabled={!isReachable}
                className={cn(
                  "flex items-center gap-2 rounded-md py-1.5 text-left transition-colors",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border border-primary/60 text-primary"
                        : "border text-muted-foreground",
                  )}
                >
                  {isComplete ? <IconCheck className="size-3.5" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:inline",
                    isCurrent
                      ? "text-foreground"
                      : isComplete
                        ? "text-foreground/80"
                        : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
            {!isLast ? (
              <li
                aria-hidden
                className={cn(
                  "h-px flex-1",
                  isComplete ? "bg-primary/40" : "bg-border",
                )}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------
// Steps
// ---------------------------------------------------------------

function StyleStep({
  form,
  setField,
  categories,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, v: FormState[K]) => void;
  categories: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="style-number">Style number *</Label>
          <Input
            id="style-number"
            value={form.style_number}
            onChange={(e) => setField("style_number", e.target.value)}
            placeholder="e.g. FA26-T001"
            className="font-mono"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Must be unique within your catalog.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="style-name">Style name</Label>
          <Input
            id="style-name"
            value={form.style_name}
            onChange={(e) => setField("style_name", e.target.value)}
            placeholder="e.g. Malibu Tank"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="style-category">Category</Label>
          <Select
            value={form.style_category_id || "__none__"}
            onValueChange={(v) =>
              setField("style_category_id", v === "__none__" ? "" : v)
            }
          >
            <SelectTrigger id="style-category">
              <SelectValue placeholder="Pick a category…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— No category —</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="style-gender">Gender</Label>
          <Select
            value={form.style_gender || "__none__"}
            onValueChange={(v) =>
              setField(
                "style_gender",
                (v === "__none__" ? "" : (v as FormState["style_gender"])),
              )
            }
          >
            <SelectTrigger id="style-gender">
              <SelectValue placeholder="Unspecified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Unspecified —</SelectItem>
              <SelectItem value="WOMENS">Women's</SelectItem>
              <SelectItem value="MENS">Men's</SelectItem>
              <SelectItem value="UNISEX">Unisex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="style-description">Style description</Label>
        <Textarea
          id="style-description"
          rows={3}
          value={form.style_description}
          onChange={(e) => setField("style_description", e.target.value)}
          placeholder="Internal notes about the silhouette."
        />
      </div>
    </div>
  );
}

function SourcingStep({
  form,
  setField,
  vendors,
  vendorsLoading,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, v: FormState[K]) => void;
  vendors: Array<{ id: string; name: string }>;
  vendorsLoading: boolean;
}) {
  return (
    <div className="grid gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="vendor">Vendor *</Label>
        <Select
          value={form.vendor_id}
          onValueChange={(v) => setField("vendor_id", v)}
        >
          <SelectTrigger id="vendor">
            <SelectValue placeholder="Pick a vendor…" />
          </SelectTrigger>
          <SelectContent>
            {vendorsLoading ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Loading vendors…
              </div>
            ) : vendors.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No vendors yet — add one in ERP first.
              </div>
            ) : (
              vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cog">COG (USD)</Label>
          <Input
            id="cog"
            type="number"
            step="0.01"
            min="0"
            value={form.cog}
            onChange={(e) => setField("cog", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hs">HS tariff code</Label>
          <Input
            id="hs"
            value={form.hs_tariff_code}
            onChange={(e) => setField("hs_tariff_code", e.target.value)}
            placeholder="e.g. 6204.62.8021"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            min="0"
            value={form.weight}
            onChange={(e) => setField("weight", e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        COG, tariff, and weight are all optional — you can fill them in
        later from the sourcing detail page.
      </p>
    </div>
  );
}

function ProductStep({
  form,
  setField,
  campaigns,
  campaignsLoading,
  colorways,
  colorwaysLoading,
  lockedStylePreview,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, v: FormState[K]) => void;
  campaigns: Array<{
    id: string;
    name: string;
    campaign_code: string | null;
  }>;
  campaignsLoading: boolean;
  colorways: Array<{
    id: string;
    name: string;
    colorway_code: string | null;
  }>;
  colorwaysLoading: boolean;
  lockedStylePreview?: string | null;
}) {
  return (
    <div className="grid gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="product-name">Product name *</Label>
        <Input
          id="product-name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="e.g. MALIBU TANK - WHITE"
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Customer-facing name — usually style + colorway.
        </p>
      </div>

      {lockedStylePreview ? (
        <div className="rounded-md border bg-muted/30 px-3 py-2.5 text-sm">
          <div className="text-xs text-muted-foreground">
            Style (being created in step 1)
          </div>
          <div className="font-mono">{lockedStylePreview}</div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="campaign">Campaign *</Label>
          <Select
            value={form.campaign_id}
            onValueChange={(v) => setField("campaign_id", v)}
          >
            <SelectTrigger id="campaign">
              <SelectValue placeholder="Pick a campaign…" />
            </SelectTrigger>
            <SelectContent>
              {campaignsLoading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading campaigns…
                </div>
              ) : campaigns.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No campaigns yet — create one first.
                </div>
              ) : (
                campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.campaign_code ? ` · ${c.campaign_code}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="colorway">Colorway *</Label>
          <Select
            value={form.colorway_id}
            onValueChange={(v) => setField("colorway_id", v)}
            disabled={!form.campaign_id}
          >
            <SelectTrigger id="colorway">
              <SelectValue
                placeholder={
                  !form.campaign_id
                    ? "Pick a campaign first…"
                    : colorwaysLoading
                      ? "Loading colorways…"
                      : "Pick a colorway…"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {colorways.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  {form.campaign_id
                    ? "This campaign has no colorways."
                    : "Select a campaign first."}
                </div>
              ) : (
                colorways.map((cw) => (
                  <SelectItem key={cw.id} value={cw.id}>
                    {cw.name}
                    {cw.colorway_code ? ` (${cw.colorway_code})` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="code">Internal product code</Label>
          <Input
            id="code"
            value={form.internal_product_code}
            onChange={(e) => setField("internal_product_code", e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="msrp">MSRP (USD)</Label>
          <Input
            id="msrp"
            type="number"
            step="0.01"
            min="0"
            value={form.msrp}
            onChange={(e) => setField("msrp", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

function DetailsStep({
  form,
  setField,
  styles,
  stylesLoading,
}: {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, v: FormState[K]) => void;
  styles: Array<{
    id: string;
    style_number: string;
    style_name: string | null;
  }>;
  stylesLoading: boolean;
}) {
  return (
    <div className="grid gap-5">
      <div className="space-y-1.5">
        <Label htmlFor="existing-style">Link to an existing style</Label>
        <Select
          value={form.existing_style_id || "__none__"}
          onValueChange={(v) =>
            setField("existing_style_id", v === "__none__" ? "" : v)
          }
        >
          <SelectTrigger id="existing-style">
            <SelectValue placeholder="Optional — leave unlinked for now" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">— No style link —</SelectItem>
            {stylesLoading ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Loading styles…
              </div>
            ) : (
              styles.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <span className="font-mono text-xs">{s.style_number}</span>
                  {s.style_name ? ` — ${s.style_name}` : ""}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Optional on this path. You can always link or change a style
          later from the product detail page.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="retail">Retail description</Label>
        <Textarea
          id="retail"
          rows={3}
          value={form.retail_description}
          onChange={(e) => setField("retail_description", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seo">SEO description</Label>
        <Textarea
          id="seo"
          rows={3}
          value={form.seo_description}
          onChange={(e) => setField("seo_description", e.target.value)}
        />
      </div>
    </div>
  );
}

function ReviewStep({
  mode,
  form,
  styles,
  campaigns,
  colorways,
  vendors,
  categories,
  error,
}: {
  mode: Mode;
  form: FormState;
  styles: Array<{
    id: string;
    style_number: string;
    style_name: string | null;
  }>;
  campaigns: Array<{
    id: string;
    name: string;
    campaign_code: string | null;
  }>;
  colorways: Array<{
    id: string;
    name: string;
    colorway_code: string | null;
  }>;
  vendors: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  error: string | null;
}) {
  const campaign = campaigns.find((c) => c.id === form.campaign_id);
  const colorway = colorways.find((c) => c.id === form.colorway_id);
  const vendor = vendors.find((v) => v.id === form.vendor_id);
  const category = categories.find((c) => c.id === form.style_category_id);
  const existingStyle = styles.find((s) => s.id === form.existing_style_id);

  return (
    <div className="grid gap-5">
      {mode === "with_style" ? (
        <ReviewSection
          title="New style"
          icon={<IconTag className="size-4" />}
          items={[
            ["Style number", form.style_number || "—"],
            ["Style name", form.style_name || "—"],
            ["Category", category?.name ?? "—"],
            ["Gender", form.style_gender || "—"],
            ["Description", form.style_description || "—"],
          ]}
        />
      ) : null}

      {mode === "with_style" ? (
        <ReviewSection
          title="Sourcing"
          icon={<IconTruckDelivery className="size-4" />}
          items={[
            ["Vendor", vendor?.name ?? "—"],
            ["COG", form.cog ? `$${Number(form.cog).toFixed(2)}` : "—"],
            ["HS tariff", form.hs_tariff_code || "—"],
            ["Weight", form.weight || "—"],
          ]}
        />
      ) : null}

      <ReviewSection
        title="Product"
        icon={<IconCube className="size-4" />}
        items={[
          ["Name", form.name || "—"],
          [
            "Style",
            mode === "with_style"
              ? `${form.style_number}${
                  form.style_name ? ` — ${form.style_name}` : ""
                }`
              : existingStyle
                ? `${existingStyle.style_number}${
                    existingStyle.style_name
                      ? ` — ${existingStyle.style_name}`
                      : ""
                  }`
                : "— (no style link)",
          ],
          [
            "Campaign",
            campaign
              ? `${campaign.name}${
                  campaign.campaign_code ? ` · ${campaign.campaign_code}` : ""
                }`
              : "—",
          ],
          [
            "Colorway",
            colorway
              ? `${colorway.name}${
                  colorway.colorway_code ? ` (${colorway.colorway_code})` : ""
                }`
              : "—",
          ],
          ["Internal code", form.internal_product_code || "—"],
          ["MSRP", form.msrp ? `$${Number(form.msrp).toFixed(2)}` : "—"],
          ["Retail description", form.retail_description || "—"],
          ["SEO description", form.seo_description || "—"],
        ]}
      />

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </div>
  );
}

function ReviewSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<[label: string, value: string]>;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        <span className="text-muted-foreground">{icon}</span>
        {title}
      </div>
      <dl className="divide-y divide-border border-y text-sm">
        {items.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,160px)_1fr] gap-4 py-2"
          >
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </dt>
            <dd className="truncate whitespace-pre-wrap">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
