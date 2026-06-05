import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  useParams,
} from '@tanstack/react-router'
import { AppDevtools } from '@/components/composites/app-devtools'
import { Toaster } from '@/components/ui/sonner'

import appCss from '@/styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

// `@vitejs/plugin-react` normally injects its Fast Refresh preamble via
// `transformIndexHtml`, but TanStack Start renders the SSR shell via
// `shellComponent` and never runs that transform. Without the preamble globals
// (`$RefreshReg$`, `$RefreshSig$`, `__vite_plugin_react_preamble_installed__`),
// every transformed React module throws at import time and hydration fails
// silently - forms then submit natively and `onClick` handlers never attach.
// We inject the preamble ourselves in dev; prod builds don't need it because
// Fast Refresh is not wired into production bundles.
const REACT_REFRESH_PREAMBLE = `import RefreshRuntime from "/@react-refresh"
RefreshRuntime.injectIntoGlobalHook(window)
window.$RefreshReg$ = () => {}
window.$RefreshSig$ = () => (type) => type
window.__vite_plugin_react_preamble_installed__ = true`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Forestack' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico', type: 'image/x-icon' },
      { rel: 'stylesheet', href: appCss },
    ],
    scripts: import.meta.env.DEV
      ? [{ type: 'module', children: REACT_REFRESH_PREAMBLE }]
      : [],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: GlobalError,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        {/*
         * App-wide toast host.  Positioned top-center so toasts read as a
         * global app-level banner rather than a notification tray; sonner
         * portals above Radix Dialog overlays so they stay visible when a
         * modal is open.  Consumers call `toast.success(…)` /
         * `toast.error(…)` from `sonner`.
         */}
        <Toaster position="top-center" richColors />
        <AppDevtools />
        <Scripts />
      </body>
    </html>
  )
}

/** Ported from INTERNAL-APP-NEXT/src/app/not-found.tsx. */
export function NotFound() {
  const { companySlug } = useParams({ strict: false })

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      {companySlug ? (
        <Link
          to="/$companySlug/dashboard"
          params={{ companySlug }}
          search={{ days: 90, channels: [] }}
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      ) : (
        <a
          href="/"
          className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </a>
      )}
    </div>
  )
}

/** Ported from INTERNAL-APP-NEXT/src/app/global-error.tsx. */
function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
        Something went wrong
      </h1>
      <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.875rem' }}>
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '1.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          borderRadius: '0.375rem',
          border: '1px solid #ddd',
          cursor: 'pointer',
          background: '#fff',
        }}
      >
        Try again
      </button>
    </div>
  )
}
