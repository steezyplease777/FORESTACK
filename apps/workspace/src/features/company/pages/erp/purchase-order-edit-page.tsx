// @ts-nocheck
import { useParams } from "@tanstack/react-router";
import { usePurchaseOrder } from "@/lib/data/erp/purchase-orders/hooks";
import { POForm } from "@/features/company/modules/erp/purchase-orders/po-form";

export function EditPurchaseOrderPage() {
  const { id } = useParams({
    from: "/$companySlug/erp/purchase-orders/$id/edit",
  });
  const { data: po, isLoading, error } = usePurchaseOrder(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xs text-muted-foreground">Loading purchase order...</p>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : "Purchase order not found"}
        </p>
      </div>
    );
  }

  return <POForm mode="edit" existingPO={po} />;
}
