import { Outlet, createFileRoute } from '@tanstack/react-router'

import { HomeSidebar } from '@/features/company/pages/home/home-sidebar'
import { PortalShell } from '@/features/company/components/portal-shell'

export const Route = createFileRoute('/$companySlug/_authed/_home')({
  component: HomeLayout,
})

function HomeLayout() {
  return (
    // `defaultSidebarOpen={false}` so `HomeSidebar` renders as the
    // thin icon rail on first paint. The home sidebar stays in the
    // collapsed "icon" state permanently; labels appear via tooltip.
    <PortalShell sidebar={<HomeSidebar />} defaultSidebarOpen={false}>
      <Outlet />
    </PortalShell>
  )
}
