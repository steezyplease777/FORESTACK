// @ts-nocheck

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/composites/data-table";
import { Badge } from "@/components/reui/badge";
import type { VendorWithCategory } from "@/lib/data/erp/vendors/client";

const columns: ColumnDef<VendorWithCategory>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant="secondary" size="sm">
          {row.original.category.name}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "contact_name",
    header: "Contact",
    cell: ({ getValue }) => getValue<string>() ?? "—",
  },
  {
    accessorKey: "contact_email",
    header: "Email",
    cell: ({ getValue }) => getValue<string>() ?? "—",
  },
  {
    accessorKey: "contact_phone",
    header: "Phone",
    cell: ({ getValue }) => getValue<string>() ?? "—",
  },
  {
    accessorKey: "website_url",
    header: "Website",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground">{getValue<string>() ?? "—"}</span>
    ),
  },
];

export function VendorTable({
  vendors,
  onRowClick,
}: {
  vendors: VendorWithCategory[];
  onRowClick: (vendor: VendorWithCategory) => void;
}) {
  return (
    <DataTable
      columns={columns}
      data={vendors}
      onRowClick={onRowClick}
      className="rounded-none border-0 bg-transparent"
    />
  );
}
