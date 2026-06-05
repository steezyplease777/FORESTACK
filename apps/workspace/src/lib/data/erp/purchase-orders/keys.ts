// @ts-nocheck
export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  list: (companyId: string) => ["purchase-orders", "list", companyId] as const,
  detail: (id: string) => ["purchase-orders", "detail", id] as const,
};
