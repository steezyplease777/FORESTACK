// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { createTenantClient } from '@/lib/datasource/supabase/tenant-client.server'

import { normalizeBundleError } from '../shared'
import type { WmsBundle } from './types'

/**
 * Fetches the full WMS portal bundle. One RPC call on portal entry;
 * everything else in the WMS module derives from the cached result
 * until a child route fires an explicit invalidation.
 *
 * IMPORTANT: `createServerFn(...).handler(...)` is declared at module
 * top level (not inside a factory) so TanStack Start's compiler
 * plugin can statically extract the handler to server-only code. If
 * this call is wrapped in another function the handler silently
 * leaks into the client bundle, `createTenantClient()` runs in the browser
 * without the session/WorkOS cookie, and the RPC raises `not_authenticated`.
 */
export const getWmsBundle = createServerFn({ method: 'GET' })
  .inputValidator((data: { companySlug: string }) => data)
  .handler(async ({ data }): Promise<WmsBundle> => {
    const supabase = createTenantClient()
    const { data: bundle, error } = await supabase.rpc('get_wms_bundle', {
      p_company_slug: data.companySlug,
    })
    if (error) normalizeBundleError(error.message)
    if (bundle == null) {
      throw new Error('get_wms_bundle returned empty bundle')
    }
    return bundle as unknown as WmsBundle
  })
