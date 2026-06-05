// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconLoader2,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { useCreatePlmSourcing } from "@/lib/data/plm/sourcing/hooks";

import {
  EMPTY_SOURCING,
  SourcingFormFields,
  sourcingFormToPayload,
} from "./sourcing-form-fields";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/sourcing/new",
);

export function PlmSourcingNewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { styleId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const [form, setForm] = React.useState(() => ({
    ...EMPTY_SOURCING,
    // Seed from ?styleId=... when the user came from a product/style detail.
    style_id: styleId ?? "",
  }));

  const createSourcing = useCreatePlmSourcing(companyId, companySlug);

  const canSubmit =
    !!form.style_id && !!form.vendor_id && !createSourcing.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const payload = sourcingFormToPayload(form);
      const created = await createSourcing.mutateAsync({
        company_id: companyId,
        ...payload,
      });
      toast.success("Sourcing created");
      navigate({
        to: `${basePath}/plm/sourcing/${created.id}`,
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  };

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
          title="New sourcing"
          description="Connect a style to a vendor and capture cost + tariff data."
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <SourcingFormFields
          companyId={companyId}
          form={form}
          onChange={setForm}
          hideHeader
        />

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" asChild>
            <Link to={`${basePath}/plm/sourcing`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={!canSubmit}>
            {createSourcing.isPending ? (
              <IconLoader2 className="size-4 animate-spin" />
            ) : (
              <IconDeviceFloppy className="size-4" />
            )}
            {createSourcing.isPending ? "Creating…" : "Create sourcing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
