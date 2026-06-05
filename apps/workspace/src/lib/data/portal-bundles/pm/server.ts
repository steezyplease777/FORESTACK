// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { createTenantClient } from '@/lib/datasource/supabase/tenant-client.server'

import { normalizeBundleError } from '../shared'
import type { PmBundle } from './types'

/**
 * Fetches the full PM portal bundle. See `wms/server.ts` for the
 * rationale behind keeping `createServerFn(...)` at module top level.
 */
export const getPmBundle = createServerFn({ method: 'GET' })
  .inputValidator((data: { companySlug: string }) => data)
  .handler(async ({ data }): Promise<PmBundle> => {
    const supabase = createTenantClient()
    const { data: bundle, error } = await supabase.rpc('get_pm_bundle', {
      p_company_slug: data.companySlug,
    })
    if (error) normalizeBundleError(error.message)
    if (bundle == null) {
      throw new Error('get_pm_bundle returned empty bundle')
    }
    return bundle as unknown as PmBundle
  })
