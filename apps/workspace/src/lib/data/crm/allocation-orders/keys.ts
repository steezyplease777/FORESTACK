// @ts-nocheck
export const crmAllocationOrderKeys = {
  all: ["crm-allocation-orders"] as const,
  list: (companyId: string) =>
    ["crm-allocation-orders", "list", companyId] as const,
  detail: (id: string) =>
    ["crm-allocation-orders", "detail", id] as const,
};
