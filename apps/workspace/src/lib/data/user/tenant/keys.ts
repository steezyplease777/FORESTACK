// @ts-nocheck
export const tenantUserKeys = {
    byId: (companyId: string, userId: string) =>
      ["tenant", "user", companyId, userId] as const,
    list: (companyId: string) =>
      ["tenant", "user", companyId] as const,
  };