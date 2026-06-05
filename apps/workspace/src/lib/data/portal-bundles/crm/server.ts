// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { createTenantClient } from '@/lib/datasource/supabase/tenant-client.server'

import { normalizeBundleError } from '../shared'
import type { CrmBundle } from './types'

/**
 * Fetches the full CRM portal bundle. See `wms/server.ts` for the
 * rationale behind keeping `createServerFn(...)` at module top level
 * (TanStack Start compiler extraction).
 */
export const getCrmBundle = createServerFn({ method: 'GET' })
  .inputValidator((data: { companySlug: string }) => data)
  .handler(async ({ data }): Promise<CrmBundle> => {
    const supabase = createTenantClient()
    const { data: bundle, error } = await supabase.rpc('get_crm_bundle', {
      p_company_slug: data.companySlug,
    })
    if (error) normalizeBundleError(error.message)
    if (bundle == null) {
      throw new Error('get_crm_bundle returned empty bundle')
    }
    return bundle as unknown as CrmBundle
  })
