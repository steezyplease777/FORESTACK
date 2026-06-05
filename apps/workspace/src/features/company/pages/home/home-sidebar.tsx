// @ts-nocheck

import { PortalSidebar } from "@/features/company/components/sidebar-profiles";

/**
 * Sidebar for the Home portal (dashboard / team / tasks / inbox).
 *
 * Thin wrapper — the profile resolved for `"home"` in
 * `components/sidebar-profiles/index.tsx` owns the whole render
 * (icon rail, Directory dropdown, Help footer, etc.).
 */
export function HomeSidebar() {
  return <PortalSidebar portal="home" />;
}
