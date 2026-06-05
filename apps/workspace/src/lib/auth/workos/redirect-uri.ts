import { getWorkOsEnv } from '@/lib/auth/workos/config'

function readEnv(name: string): string | undefined {
  return (
    (typeof process !== 'undefined' ? process.env[name] : undefined) ??
    (import.meta.env as Record<string, string | undefined>)[name]
  )
}

/**
 * OAuth redirect URI for WorkOS AuthKit callbacks on the tenant host.
 *
 * Prefer `WORKOS_REDIRECT_URI` when set (single-tenant dev). Otherwise derive
 * from the request host: `https://{slug}.forestack.space/auth/workos-callback`.
 */
export function buildWorkOsRedirectUri(
  companySlug: string,
  requestHost?: string,
): string {
  const override = getWorkOsEnv().redirectUriOverride
  if (override) return override

  const host = requestHost?.trim()
  if (host) {
    const protocol = host.includes('localhost') ? 'http' : 'https'
    return `${protocol}://${host}/auth/workos-callback`
  }

  const devHost = readEnv('DEV_HOST') ?? 'localhost:3001'
  const tenantHost = readEnv('TENANT_HOST') ?? 'forestack.space'
  const isDev =
    devHost.includes('localhost') || devHost.includes('127.0.0.1')
  const baseHost = isDev ? `${companySlug}.${devHost}` : `${companySlug}.${tenantHost}`
  const protocol = isDev ? 'http' : 'https'
  return `${protocol}://${baseHost}/auth/workos-callback`
}
