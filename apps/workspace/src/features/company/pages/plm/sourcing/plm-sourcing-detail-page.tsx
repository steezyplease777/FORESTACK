// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconEdit,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

import {
  useDeletePlmSourcing,
  usePlmSourcingDetail,
  useUpdatePlmSourcing,
} from "@/lib/data/plm/sourcing/hooks";

import {
  SourcingFormFields,
  sourcingFormToPayload,
  type SourcingFormState,
} from "./sourcing-form-fields";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/sourcing/$sourcingId",
);

export function PlmSourcingDetailPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { sourcingId } = routeApi.useParams();
  const navigate = useNavigate();

  const sourcingQuery = usePlmSourcingDetail(companyId, sourcingId);
  const updateSourcing = useUpdatePlmSourcing(companyId, companySlug);
  const deleteSourcing = useDeletePlmSourcing(companyId, companySlug);

  const [isEditing, setIsEditing] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const sourcing = sourcingQuery.data;

  const initialForm = React.useMemo<SourcingFormState>(
    () => ({
      style_id: sourcing?.style_id ?? "",
      vendor_id: sourcing?.vendor_id ?? "",
      cog: sourcing?.cog != null ? String(sourcing.cog) : "",
      hs_tariff_code: sourcing?.hs_tariff_code ?? "",
      weight: sourcing?.weight != null ? String(sourcing.weight) : "",
    }),
    [sourcing],
  );
  const [form, setForm] = React.useState<SourcingFormState>(initialForm);
  React.useEffect(() => {
    if (!isEditing) setForm(initialForm);
  }, [initialForm, isEditing]);

  const handleSave = async () => {
    if (!sourcing) return;
    try {
      const payload = sourcingFormToPayload(form);
      await updateSourcing.mutateAsync({
        id: sourcing.id,
        // Style is locked in edit mode (see SourcingFormFields) — send
        // the rest of the patch plus vendor (in case that changed).
        vendor_id: payload.vendor_id,
        cog: payload.cog,
        hs_tariff_code: payload.hs_tariff_code,
        weight: payload.weight,
      });
      toast.success("Sourcing updated");
      setIsEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  };

  if (sourcingQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!sourcing) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-6">
        <Button variant="ghost" size="sm" asChild className="self-start">
          <Link to={`${basePath}/plm/sourcing`}>
            <IconArrowLeft className="size-4" />
            Back to Sourcing
          </Link>
        </Button>
        <div className="rounded-md border bg-muted/30 p-6">
          <h2 className="text-base font-semibold">Sourcing not found</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This sourcing row may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={`${basePath}/plm/sourcing`}>
            <IconArrowLeft className="size-4" />
            Back to Sourcing
          </Link>
        </Button>
        <PageHeader
          title={
            sourcing.style
              ? `${sourcing.style.style_number} · ${sourcing.vendor?.name ?? "—"}`
              : "Sourcing record"
          }
          description={
            <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {sourcing.style?.style_name ? (
                <span>{sourcing.style.style_name}</span>
              ) : null}
              {sourcing.hs_tariff_code ? (
                <Badge variant="outline" className="font-mono">
                  HS {sourcing.hs_tariff_code}
                </Badge>
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
                  disabled={updateSourcing.isPending}
                  onClick={() => setIsEditing(false)}
                >
                  <IconX className="size-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={updateSourcing.isPending}
                  onClick={handleSave}
                >
                  <IconDeviceFloppy className="size-4" />
                  {updateSourcing.isPending ? "Saving…" : "Save"}
                </Button>
              </>
            )
          }
        />
      </div>

      {isEditing ? (
        <SourcingFormFields
          companyId={companyId}
          form={form}
          onChange={setForm}
          lockStyle
          hideHeader
        />
      ) : (
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <DetailSection title="Style">
              {sourcing.style ? (
                <>
                  <p className="font-mono text-sm">
                    {sourcing.style.style_number}
                  </p>
                  {sourcing.style.style_name ? (
                    <p className="text-sm text-muted-foreground">
                      {sourcing.style.style_name}
                    </p>
                  ) : null}
                  {sourcing.style.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {sourcing.style.description}
                    </p>
                  ) : null}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </DetailSection>

            <DetailSection title="Vendor">
              <p className="text-sm">
                {sourcing.vendor?.name ?? (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            </DetailSection>
          </div>

          <DetailSection
            title="Cost & logistics"
            description="Captured per sourcing row — duplicate and tweak when vendors differ on the same style."
          >
            <dl className="grid gap-4 sm:grid-cols-3">
              <Stat
                label="COG"
                value={
                  sourcing.cog != null
                    ? `$${Number(sourcing.cog).toFixed(2)}`
                    : "—"
                }
              />
              <Stat
                label="HS tariff code"
                value={sourcing.hs_tariff_code ?? "—"}
                mono
              />
              <Stat
                label="Weight"
                value={sourcing.weight != null ? `${sourcing.weight}` : "—"}
              />
            </dl>
          </DetailSection>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this sourcing record?"
        description="Permanently removes the row. Any product still linked to this record will block deletion — unlink those first."
        confirmText={deleteSourcing.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          try {
            await deleteSourcing.mutateAsync({ id: sourcing.id });
            setDeleteOpen(false);
            navigate({ to: `${basePath}/plm/sourcing` });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
          }
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function DetailSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3 border-b pb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
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
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "font-mono text-sm" : "text-sm"}>{value}</p>
    </div>
  );
}
