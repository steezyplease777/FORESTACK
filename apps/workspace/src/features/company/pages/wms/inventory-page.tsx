// @ts-nocheck

import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";

export function InventoryPage() {
  return (
    <>
      <PageHeader title="Inventory" description="Track your warehouse inventory." />
      <EmptyState title="No inventory items" description="Inventory will appear here once tracked." />
    </>
  );
}
