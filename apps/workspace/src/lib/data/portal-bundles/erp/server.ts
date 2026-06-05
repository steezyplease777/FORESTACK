// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { getTenantSupabase } from '@/lib/data/_shared/tenant-supabase'

import { normalizeBundleError } from '../shared'
import type { ErpBundle } from './types'

/**
 * Fetches the full ERP portal bundle. See `wms/server.ts` for the
 * rationale behind keeping `createServerFn(...)` at module top level.
 */
export const getErpBundle = createServerFn({ method: 'GET' })
  .inputValidator((data: { companySlug: string }) => data)
  .handler(async ({ data }): Promise<ErpBundle> => {
    const supabase = await getTenantSupabase()
    const { data: bundle, error } = await supabase.rpc('get_erp_bundle', {
      p_company_slug: data.companySlug,
    })
    if (error) normalizeBundleError(error.message)
    if (bundle == null) {
      throw new Error('get_erp_bundle returned empty bundle')
    }
    return bundle as unknown as ErpBundle
  })
