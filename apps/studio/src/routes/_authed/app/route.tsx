import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Pass-through parent for `/app/*`. Auth + no-org → onboarding logic runs
 * in `_saasPortal/_authed.tsx`; the workspace chrome (header, nav, org
 * switcher) is owned by `WorkspaceShell` rendered inside each leaf so
 * non-shell pages (`/app`, `/app/workspaces`, `/app/settings`) can opt out.
 */

export const Route = createFileRoute('/_authed/app')({
  component: () => <Outlet />,
})
