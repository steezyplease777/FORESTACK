// @ts-nocheck

import { useParams } from "@tanstack/react-router";
import { useCompany } from "@/features/company/tenant-provider";
import { useCrmCompany } from "@/lib/data/crm/companies/hooks";
import { Badge } from "@/components/reui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  IconBuilding,
  IconMail,
  IconPhone,
  IconMapPin,
  IconWorld,
} from "@tabler/icons-react";
import { usePageBreadcrumb } from "@/features/company/components/header/page-breadcrumb-context";

export function CustomerDetailPage() {
  const { id } = useParams({
    from: "/$companySlug/crm/customers/$id",
  });
  const { company } = useCompany();
  const { data: customer, isLoading, error } = useCrmCompany(id);

  // Register the customer name into the global header breadcrumb so
  // the portal page header shows `CRM › Customers › <name>` instead
  // of stopping at "Customers". No-op while the query is loading and
  // self-cleans on unmount.
  usePageBreadcrumb(customer?.name);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading customer…</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "Customer not found"}
        </p>
      </div>
    );
  }

  const address = [
    customer.billing_address,
    customer.billing_city,
    customer.billing_state,
    customer.billing_zip,
    customer.billing_country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-dvh space-y-6 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
          <IconBuilding className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{customer.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>ID: {customer.company_id}</span>
            {customer.sales_channel && (
              <>
                <span>·</span>
                <Badge variant="secondary" size="sm">
                  {customer.sales_channel.name}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Primary billing contact details for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-3">
              <IconMail className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Email
                </p>
                <p className="text-sm">{customer.billing_email || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconPhone className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Phone
                </p>
                <p className="text-sm">{customer.billing_phone || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
            <CardDescription>
              Address on file for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-start gap-3">
              <IconMapPin className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Address
                </p>
                <p className="text-sm">
                  {customer.billing_address || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconWorld className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  City / State / Zip
                </p>
                <p className="text-sm">
                  {[customer.billing_city, customer.billing_state, customer.billing_zip]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </p>
                {customer.billing_country && (
                  <p className="text-sm text-muted-foreground">
                    {customer.billing_country}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meta */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Sales Channel
              </dt>
              <dd className="mt-1">
                {customer.sales_channel ? (
                  <Badge variant="secondary" size="sm">
                    {customer.sales_channel.name}
                  </Badge>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Created
              </dt>
              <dd className="mt-1">
                {new Date(customer.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                Full Address
              </dt>
              <dd className="mt-1">{address || "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
