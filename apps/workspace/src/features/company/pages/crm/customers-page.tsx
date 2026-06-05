// @ts-nocheck

import { useCompany } from "@/features/company/tenant-provider";
import { useCrmCompanies } from "@/lib/data/crm/companies/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/reui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import AccountTable from "@/features/company/modules/crm/customers/account-table";
import TabsTemplate from "@/features/company/modules/templates/tabs";


export function CustomersPage() {
  const { company, companySlug } = useCompany();
  console.log(company);
  const companyId = company?.companyId ?? "";
  const { data: companies, isLoading, error } = useCrmCompanies(companyId);

  const tabs = [
    {
      label: "Companies",
      value: "companies",
      jsxData: <AccountTable companies={companies ?? []} companySlug={companySlug} />,
    },
    {
      label: "Contacts",
      value: "contacts",
      jsxData: <div>Contacts</div>,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage CRM company accounts."
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-muted-foreground">
              Loading customers...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage CRM company accounts."
        />
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to load customers"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="Manage CRM company accounts."
        />
        <EmptyState
          title="No customers"
          description="CRM company accounts will appear here once created."
        />
      </div>
    );
  }

  return (
      <div className="py-5">
        <TabsTemplate tabs={tabs} />
      </div>
  );
}
