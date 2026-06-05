// @ts-nocheck

import { PortalSidebar } from "@/features/company/components/sidebar-profiles";

/**
 * Sidebar for the Warehouse Management System portal.
 *
 * Thin wrapper around `<PortalSidebar>`; the actual render logic
 * lives in the profile resolved for the `"wms"` slug. Swap that
 * profile in `components/sidebar-profiles/index.tsx` to A/B test a
 * different sidebar variant for WMS without touching this file.
 */
export function WmsSidebar() {
  return <PortalSidebar portal="wms" />;
}
