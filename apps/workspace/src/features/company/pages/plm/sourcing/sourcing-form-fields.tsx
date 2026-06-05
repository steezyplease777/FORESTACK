// @ts-nocheck
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlmStyles } from "@/lib/data/plm/styles/hooks";
import { useVendors } from "@/lib/data/erp/vendors/hooks";

/**
 * Shared form body used by the sourcing "new" page and the inline
 * edit mode on the sourcing detail page. Keeping it in one place
 * means adding a new field (e.g. lead time) only touches one file.
 */
export type SourcingFormState = {
  style_id: string;
  vendor_id: string;
  cog: string;
  hs_tariff_code: string;
  weight: string;
};

export const EMPTY_SOURCING: SourcingFormState = {
  style_id: "",
  vendor_id: "",
  cog: "",
  hs_tariff_code: "",
  weight: "",
};

export function SourcingFormFields({
  companyId,
  form,
  onChange,
  lockStyle = false,
  hideHeader = false,
}: {
  companyId: string;
  form: SourcingFormState;
  onChange: (next: SourcingFormState) => void;
  /** Disable the style picker (detail page — changing style would
   * orphan any products pointing at this row). */
  lockStyle?: boolean;
  /** Hide the section heading when the host page already provides one. */
  hideHeader?: boolean;
}) {
  const stylesQuery = usePlmStyles(companyId);
  const vendorsQuery = useVendors(companyId);

  const set = <K extends keyof SourcingFormState>(
    key: K,
    value: string,
  ) => onChange({ ...form, [key]: value });

  return (
    <section>
      {hideHeader ? null : (
        <header className="mb-4">
          <h3 className="text-base font-semibold">Sourcing details</h3>
          <p className="text-sm text-muted-foreground">
            Bind a vendor to a style and capture the COG / HS tariff / weight
            a buyer needs for POs and landed-cost math.
          </p>
        </header>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="style">Style *</Label>
          <Select
            value={form.style_id}
            onValueChange={(v) => set("style_id", v)}
            disabled={lockStyle}
          >
            <SelectTrigger id="style">
              <SelectValue placeholder="Pick a style…" />
            </SelectTrigger>
            <SelectContent>
              {stylesQuery.isLoading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading styles…
                </div>
              ) : (stylesQuery.data ?? []).length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No styles yet
                </div>
              ) : (
                (stylesQuery.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-mono text-xs">{s.style_number}</span>
                    {s.style_name ? ` — ${s.style_name}` : ""}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {lockStyle ? (
            <p className="text-xs text-muted-foreground">
              Style can't be changed — create a new sourcing row instead.
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="vendor">Vendor *</Label>
          <Select
            value={form.vendor_id}
            onValueChange={(v) => set("vendor_id", v)}
          >
            <SelectTrigger id="vendor">
              <SelectValue placeholder="Pick a vendor…" />
            </SelectTrigger>
            <SelectContent>
              {vendorsQuery.isLoading ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Loading vendors…
                </div>
              ) : (vendorsQuery.data ?? []).length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No vendors yet
                </div>
              ) : (
                (vendorsQuery.data ?? []).map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cog">COG (USD)</Label>
          <Input
            id="cog"
            type="number"
            step="0.01"
            min="0"
            value={form.cog}
            onChange={(e) => set("cog", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hs">HS tariff code</Label>
          <Input
            id="hs"
            value={form.hs_tariff_code}
            onChange={(e) => set("hs_tariff_code", e.target.value)}
            className="font-mono"
            placeholder="e.g. 6204.62.8021"
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            min="0"
            value={form.weight}
            onChange={(e) => set("weight", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Per-unit weight for shipping calculations.
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Converts form state into the payload shape the create/update
 * mutations expect. Throws descriptive errors so the caller can
 * surface them via `toast.error`.
 */
export function sourcingFormToPayload(form: SourcingFormState): {
  style_id: string;
  vendor_id: string;
  cog: number | null;
  hs_tariff_code: string | null;
  weight: number | null;
} {
  if (!form.style_id) throw new Error("Style is required");
  if (!form.vendor_id) throw new Error("Vendor is required");

  const parseNullableNumber = (raw: string, label: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    if (Number.isNaN(n)) throw new Error(`${label} must be a number`);
    return n;
  };

  return {
    style_id: form.style_id,
    vendor_id: form.vendor_id,
    cog: parseNullableNumber(form.cog, "COG"),
    hs_tariff_code:
      form.hs_tariff_code.trim() === "" ? null : form.hs_tariff_code.trim(),
    weight: parseNullableNumber(form.weight, "Weight"),
  };
}
