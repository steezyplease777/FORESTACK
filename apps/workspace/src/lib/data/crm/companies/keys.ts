// @ts-nocheck
export const crmCompanyKeys = {
  all: ["crm-companies"] as const,
  list: (companyId: string) => ["crm-companies", "list", companyId] as const,
  detail: (id: string) => ["crm-companies", "detail", id] as const,
};
