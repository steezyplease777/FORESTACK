import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getContext } from '@/integrations/tanstack-query/root-provider'
import { currentHost } from '@/lib/utils/domain-type'
import { makeTenantRewrite } from '@/lib/routing/tenant-rewrite'
import { NotFound } from './routes/__root'

export function getRouter() {
  const context = getContext()
  // `getRouter()` runs per-request on the server (TanStack Start creates a
  // fresh router per fetch) and once at boot on the client. `currentHost()`
  // is isomorphic - server branch reads the incoming Request via AsyncLocal-
  // Storage, client branch reads `window.location.host`. That gives us the
  // correct rewrite config per portal without any per-route plumbing.
  const rewrite = makeTenantRewrite(currentHost())

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    // `intent` preload kicks loaders on hover/focus so a click feels
    // instant. The previous `staleTime: 0` meant every hover also re-
    // fired any route loader that had already run — harmless for cached
    // queries (React Query dedupes), but expensive for anything that
    // doesn't flow through RQ (route-level side effects, server fn
    // preloads without `ensureQueryData`, etc.). 30s is aggressive
    // enough that the user still sees fresh data on any real navigation
    // intent, and lazy enough that scrubbing the cursor across the
    // sidebar doesn't blast the server.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    defaultNotFoundComponent: NotFound,
    rewrite,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
