// @ts-nocheck
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { crmCompanyKeys } from './keys'
import { getCrmCompanies, getCrmCompany } from './server'

export function useCrmCompanies(companyId: string) {
  return useQuery({
    queryKey: crmCompanyKeys.list(companyId),
    queryFn: () => getCrmCompanies({ data: { companyId } }),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  })
}

export function useCrmCompany(id: string | null) {
  return useQuery({
    queryKey: crmCompanyKeys.detail(id ?? ''),
    queryFn: () => getCrmCompany({ data: { id: id! } }),
    enabled: !!id,
    placeholderData: keepPreviousData,
  })
}
