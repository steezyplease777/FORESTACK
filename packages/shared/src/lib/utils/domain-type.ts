/**
 * Host-based portal detection.
 *
 * Mirrors the legacy Next.js `whatPortal()` helper. A request can land on one
 * of two parallel portals:
 *
 *   - STUDIO: the SaaS app for org admins.
 *       prod: forestack.dev (or any *.forestack.dev)
 *       dev:  localhost:3000
 *
 *   - TENANT: a per-company portal.
 *       prod: {slug}.forestack.space
 *       dev:  {slug}.${DEV_HOST} (workspace dev: DEV_HOST=localhost:3001)
 *
 * Defaults match the Next.js app. Override per-environment via env vars when
 * you bring up new stages (e.g. staging.forestack.dev / staging.forestack.space).
 */

const PROCESS_ENV =
  typeof process !== 'undefined' && process?.env
    ? process.env
    : ({} as Record<string, string | undefined>)

const VITE_ENV: Record<string, string | undefined> = (() => {
  try {
    return {
      SAAS_HOST: import.meta.env.SAAS_HOST as string | undefined,
      VITE_SAAS_HOST: import.meta.env.VITE_SAAS_HOST as string | undefined,
      TENANT_HOST: import.meta.env.TENANT_HOST as string | undefined,
      VITE_TENANT_HOST: import.meta.env.VITE_TENANT_HOST as string | undefined,
      DEV_HOST: import.meta.env.DEV_HOST as string | undefined,
      VITE_DEV_HOST: import.meta.env.VITE_DEV_HOST as string | undefined,
      NODE_ENV: import.meta.env.MODE as string | undefined,
    }
  } catch {
    return {}
  }
})()

function envValue(name: keyof typeof VITE_ENV | string): string | undefined {
  return VITE_ENV[name as keyof typeof VITE_ENV] ?? PROCESS_ENV[name]
}

const SAAS_DOMAIN =
  envValue('SAAS_HOST') ?? envValue('VITE_SAAS_HOST') ?? 'forestack.dev'
const TENANT_ROOT =
  envValue('TENANT_HOST') ?? envValue('VITE_TENANT_HOST') ?? 'forestack.space'
const DEV_HOST =
  envValue('DEV_HOST') ?? envValue('VITE_DEV_HOST') ?? 'localhost:3000'

export type PortalInfo =
  | { type: 'TENANT'; sub: string }
  | { type: 'STUDIO' }

import { createIsomorphicFn } from '@tanstack/react-start'
import { readRequestHost } from './host.server'

/**
 * Read the current request host in a way that works from either a server
 * function / beforeLoad (SSR) or the browser (post-hydration client nav).
 * The server branch uses the AsyncLocalStorage-backed request via a
 * `.server.ts` helper; the client branch reads `window.location.host`.
 */
export const currentHost = createIsomorphicFn()
  .server((): string => readRequestHost())
  .client((): string =>
    typeof window !== 'undefined' ? window.location.host : '',
  )

export function whatPortal(host: string | null | undefined): PortalInfo {
  const domain = (host ?? '').toLowerCase().trim()
  if (!domain) return { type: 'STUDIO' }

  // Dev tenant subdomains: `{slug}.localhost` or `{slug}.localhost:{port}`.
  // Studio (:3000) and workspace (:3001) both use this pattern; `DEV_HOST` may
  // only match one port in `.env.local`, so detect the hostname shape directly.
  const localhostTenant = domain.match(
    /^([a-z0-9][-a-z0-9]*)\.localhost(?::\d+)?$/,
  )
  if (localhostTenant?.[1]) {
    return { type: 'TENANT', sub: localhostTenant[1] }
  }

  if (domain === DEV_HOST) {
    return { type: 'STUDIO' }
  }
  if (domain.endsWith(`.${DEV_HOST}`)) {
    const slug = domain.slice(0, -`.${DEV_HOST}`.length)
    if (slug) return { type: 'TENANT', sub: slug }
  }

  if (domain.endsWith(`.${TENANT_ROOT}`) || domain === TENANT_ROOT) {
    const slug = domain.slice(0, -`.${TENANT_ROOT}`.length).replace(/\.$/, '')
    if (slug) return { type: 'TENANT', sub: slug }
  }

  if (domain === SAAS_DOMAIN || domain.endsWith(`.${SAAS_DOMAIN}`)) {
    return { type: 'STUDIO' }
  }

  return { type: 'STUDIO' }
}

export const portalDomains = {
  saas: SAAS_DOMAIN,
  tenantRoot: TENANT_ROOT,
  dev: DEV_HOST,
}

/**
 * Build an absolute URL pointing at a tenant portal. Use this for cross-portal
 * navigation (e.g. linking from the studio app into a specific tenant) since
 * the two live on different hostnames and a normal `<Link>` won't cross.
 */
function isProdMode(): boolean {
  const mode = envValue('NODE_ENV') ?? 'development'
  return mode === 'production'
}

export function tenantUrl(slug: string, path = '/'): string {
  const root = isProdMode() ? TENANT_ROOT : DEV_HOST
  const protocol = isProdMode() ? 'https' : 'http'
  const safePath = path.startsWith('/') ? path : `/${path}`
  return `${protocol}://${slug}.${root}${safePath}`
}

/**
 * Same idea but for the studio (SaaS) portal.
 */
export function studioUrl(path = '/'): string {
  const root = isProdMode() ? SAAS_DOMAIN : DEV_HOST
  const protocol = isProdMode() ? 'https' : 'http'
  const safePath = path.startsWith('/') ? path : `/${path}`
  return `${protocol}://${root}${safePath}`
}
