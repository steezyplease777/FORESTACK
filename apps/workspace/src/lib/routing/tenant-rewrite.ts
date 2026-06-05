import { whatPortal } from '@/lib/utils/domain-type'

/**
 * Build a TanStack Router `rewrite` config that makes a tenant subdomain
 * transparently match routes defined under `/$companySlug/*`
 * in the route tree. The user never sees `$companySlug` in the URL - the
 * slug is derived from the host.
 *
 *   rewrite.input  (history -> router):   /dashboard   -> /{slug}/dashboard
 *   rewrite.output (router  -> history):  /{slug}/x    -> /x
 *
 * Effects:
 *   - Incoming request for `/dashboard` on `acme.forestack.studio` is matched
 *     against the `/$companySlug/dashboard` route (slug = "acme").
 *   - `<Link to="/$companySlug/dashboard">` renders as `href="/dashboard"` and
 *     pushes `/dashboard` to the browser URL bar.
 *   - Server `redirect({ to: '/$companySlug/login' })` sends
 *     `Location: /login`.
 *
 * Returns `undefined` on studio hosts so the router behaves like a plain app.
 *
 * NOTE: The `_companyPortal` wrapper is a TanStack "pathless" layout (its `_`
 * prefix is stripped from the URL path). So the URL-tree form of the prefix
 * is `/{slug}`, NOT `/{slug}`.
 */
export function makeTenantRewrite(host: string) {
  const portal = whatPortal(host)
  if (portal.type !== 'TENANT') return undefined

  const prefix = `/${portal.sub}`
  const prefixWithSlash = `${prefix}/`

  // Framework internals (TanStack Start server fns, Vite module URLs, HMR
  // channels, etc.) must bypass the rewrite or they end up being prefixed
  // with the tenant slug and resolved against the app route tree. That
  // caused POSTs to `/_serverFn` to be rewritten to `/{slug}/_serverFn`,
  // which had no matching route and bounced back as a 307 to `/login`.
  const isInternal = (pathname: string) =>
    pathname.startsWith('/_') || pathname.startsWith('/@')

  return {
    input: ({ url }: { url: URL }): URL => {
      const pathname = url.pathname
      if (isInternal(pathname)) return url
      if (pathname === prefix || pathname.startsWith(prefixWithSlash)) {
        return url
      }
      if (pathname === '/' || pathname === '') {
        url.pathname = prefix
      } else {
        url.pathname = prefix + pathname
      }
      return url
    },
    output: ({ url }: { url: URL }): URL => {
      const pathname = url.pathname
      if (isInternal(pathname)) return url
      if (pathname === prefix) {
        url.pathname = '/'
      } else if (pathname.startsWith(prefixWithSlash)) {
        url.pathname = pathname.slice(prefix.length)
      }
      return url
    },
  }
}
