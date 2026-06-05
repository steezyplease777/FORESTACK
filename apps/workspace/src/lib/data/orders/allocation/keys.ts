// @ts-nocheck
export const allocationKeys = {
  all: ["allocations"] as const,
  list: (companyId: string) => ["allocations", "list", companyId] as const,
  detail: (id: string) => ["allocations", "detail", id] as const,
};
