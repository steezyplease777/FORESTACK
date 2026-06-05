import { createFileRoute, redirect } from '@tanstack/react-router'

/**
 * `/app/workspaces` used to be the multi-org picker. That UI is now
 * `/app` itself ("My organizations" + empty-state Create CTA), so this
 * route becomes a permanent redirect. Kept to avoid breaking any
 * bookmarks or in-app links that may still point at the old path.
 */
const Route = createFileRoute('/_authed/app/workspaces')({
  beforeLoad: () => {
    throw redirect({ to: '/app' })
  },
})

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { Route }
