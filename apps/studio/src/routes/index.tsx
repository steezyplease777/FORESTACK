import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Studio `/`. Tenant hosts never reach this route - the router `rewrite.input`
 * (see `src/lib/routing/tenant-rewrite.ts`) prefixes their URL with
 * `/t/{slug}` so they land on `/$companySlug/_home/` instead.
 *
 * We don't render a public marketing page, so just bounce through to the
 * studio login. If the visitor is already authed the `_authed` guard on
 * downstream routes will carry them forward.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
