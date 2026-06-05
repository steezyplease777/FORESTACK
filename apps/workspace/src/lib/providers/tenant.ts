import { createClient } from '@/lib/datasource/supabase/server'
import type { PortalTheme } from '@/lib/theme/types'

export type ResolvedCompany =
  | { companyId: null }
  | {
      companyId: string
      name: string
      logo_url: string | null
      organizationId: string
      customThemePortal: boolean | null
      portalTheme: PortalTheme | null
    }

export async function resolveCompanyBySlug(
  companySlug: string,
): Promise<ResolvedCompany> {
  const supabase = createClient()

  // Uses a SECURITY DEFINER RPC so unauthenticated tenant-subdomain
  // requests can still resolve branding + org id without us having to
  // keep a permissive anon SELECT policy on app_companies. The function
  // returns only the public columns it needs (name, logo, theme).
  const { data, error } = await (supabase.rpc as any)(
    'get_company_public_by_slug',
    { p_slug: companySlug },
  ).maybeSingle()

  if (error || !data) {
    return { companyId: null }
  }

  const row = data as {
    id: string
    name: string
    logo_url: string | null
    organization_id: string
    custom_theme_portal: boolean | null
    portal_theme: unknown
  }
  return {
    companyId: row.id,
    name: row.name,
    logo_url: row.logo_url,
    organizationId: row.organization_id,
    customThemePortal: row.custom_theme_portal,
    portalTheme: row.portal_theme as PortalTheme | null,
  }
}
