import { WorkOSNotConfiguredError } from '@/lib/auth/workos/types'

export type WorkOSEnv = {
  apiKey: string
  clientId: string
  authDomain: string
  redirectUriOverride: string | null
  enabled: boolean
}

function readEnv(name: string): string | undefined {
  return (
    (typeof process !== 'undefined' ? process.env[name] : undefined) ??
    (import.meta.env as Record<string, string | undefined>)[name]
  )
}

/** True when server has the minimum WorkOS credentials. */
export function isWorkOsConfigured(): boolean {
  const apiKey = readEnv('WORKOS_API_KEY')
  const clientId = readEnv('WORKOS_CLIENT_ID')
  return Boolean(apiKey?.trim() && clientId?.trim())
}

export function isWorkOsAuthEnabled(): boolean {
  const flag = readEnv('WORKOS_AUTH_ENABLED')
  if (flag === 'true' || flag === '1') return isWorkOsConfigured()
  return false
}

/** WorkOS issuer URL registered in Supabase Third-Party Auth. */
export function workOsIssuerUrl(clientId: string, authDomain: string): string {
  const host = authDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${host}/user_management/${clientId}`
}

export function getWorkOsEnv(): WorkOSEnv {
  const apiKey = readEnv('WORKOS_API_KEY')?.trim() ?? ''
  const clientId = readEnv('WORKOS_CLIENT_ID')?.trim() ?? ''
  const authDomain =
    readEnv('WORKOS_AUTH_DOMAIN')?.trim() || 'api.workos.com'
  const redirectUriOverride = readEnv('WORKOS_REDIRECT_URI')?.trim() ?? null
  const enabled = isWorkOsAuthEnabled()

  return {
    apiKey,
    clientId,
    authDomain,
    redirectUriOverride,
    enabled,
  }
}

export function requireWorkOsEnv(): WorkOSEnv {
  const env = getWorkOsEnv()
  if (!env.apiKey || !env.clientId) {
    throw new WorkOSNotConfiguredError()
  }
  return env
}

/** AuthKit authorize endpoint host (no trailing slash). */
export function workOsApiOrigin(authDomain: string): string {
  const host = authDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  return `https://${host}`
}
