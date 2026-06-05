// @ts-nocheck
import { PageHeader } from "@/components/composites/page-header";
import ProductTable from "@/features/company/modules/plm/products/product-table";
import TabsTemplate from "@/features/company/modules/templates/tabs";
import { useCompany } from "@/features/company/tenant-provider";

export function ProductsPage() {
  const { company } = useCompany();
  const companyId = company?.companyId ?? "";

  const tabs = [
    {
      label: "Products",
      value: "products",
      jsxData: <ProductTable companyId={companyId} />,
    },
  ];

  return (
    <div className="py-2">
      <PageHeader
        title="Products"
        description="Browse and manage products and variants."
      />
      <TabsTemplate tabs={tabs} />
    </div>
  );
}
