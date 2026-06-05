// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { createClient } from '@/lib/datasource/supabase/server'

import { normalizeBundleError } from '../shared'
import type { PlmBundle } from './types'

/**
 * Fetches the full PLM portal bundle. See `wms/server.ts` for the
 * rationale behind keeping `createServerFn(...)` at module top level.
 */
export const getPlmBundle = createServerFn({ method: 'GET' })
  .inputValidator((data: { companySlug: string }) => data)
  .handler(async ({ data }): Promise<PlmBundle> => {
    const supabase = createClient()
    const { data: bundle, error } = await supabase.rpc('get_plm_bundle', {
      p_company_slug: data.companySlug,
    })
    if (error) normalizeBundleError(error.message)
    if (bundle == null) {
      throw new Error('get_plm_bundle returned empty bundle')
    }
    return bundle as unknown as PlmBundle
  })
