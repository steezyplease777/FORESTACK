// @ts-nocheck
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { tenantUserKeys } from './keys'
import { getTenantCompanyUser } from './server'

export function useTenantUser(companyId: string, userId: string) {
  return useQuery({
    queryKey: tenantUserKeys.byId(companyId, userId),
    queryFn: () => getTenantCompanyUser({ data: { companyId } }),
    enabled: !!companyId && !!userId,
    placeholderData: keepPreviousData,
  })
}
