// @ts-nocheck

import { useRouter } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/composites/data-table";
import type { CrmCompanyWithChannel } from "@/lib/data/crm/companies/client";

const columns: ColumnDef<CrmCompanyWithChannel>[] = [
  {
    accessorKey: "name",
    header: "Title",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    id: "sales_channel",
    header: () => <span className="block text-center">Sales Channel</span>,
    cell: ({ row }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {row.original.sales_channel?.name}
      </span>
    ),
  },
  {
    accessorKey: "billing_city",
    header: () => <span className="block text-center">City</span>,
    cell: ({ getValue }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "billing_state",
    header: () => <span className="block text-center">State</span>,
    cell: ({ getValue }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "billing_email",
    header: () => <span className="block text-center">Email</span>,
    cell: ({ getValue }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "billing_phone",
    header: () => <span className="block text-center">Phone</span>,
    cell: ({ getValue }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "billing_zip",
    header: () => <span className="block text-center">Zip</span>,
    cell: ({ getValue }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
  {
    accessorKey: "billing_country",
    header: () => <span className="block text-center">Country</span>,
    cell: ({ getValue }) => (
      <span className="block text-center text-sm text-muted-foreground">
        {getValue<string>()}
      </span>
    ),
  },
];

export default function AccountTable({
  companies,
  companySlug,
}: {
  companies: CrmCompanyWithChannel[];
  companySlug: string;
}) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={companies}
      onRowClick={(company) =>
        router.push(`/${companySlug}/crm/customers/${company.id}`)
      }
    />
  );
}
