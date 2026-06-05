// @ts-nocheck

import type * as React from "react";

import type {
  SidebarContext,
  SidebarSchema,
} from "@/lib/navigation/types";

export type {
  ActiveMatch,
  FooterItem,
  NavItem,
  NavSection,
  SidebarBrand,
} from "@/lib/navigation/types";

/**
 * Every portal that mounts a sidebar. Keep in sync with the route
 * tree under `src/features/company/pages/*`. `Record<PortalSlug, …>`
 * in the registry enforces exhaustiveness so adding a portal without
 * a schema/renderer is a TS error, not a silent runtime miss.
 */
export type PortalSlug = "home" | "wms" | "crm" | "erp" | "pm" | "plm";

/**
 * Shared context passed to every schema/renderer render fn. Built
 * once per mount in `PortalSidebar` so schemas stay pure — they
 * don't each need to call React hooks to derive the same values.
 */
export type PortalSidebarContext = SidebarContext & {
  portal: PortalSlug;
  companySlug: string;
};

/** Workspace alias for the shared `SidebarSchema` type. */
export type PortalSidebarSchema = SidebarSchema;

export type SidebarRenderer = (
  schema: PortalSidebarSchema,
  ctx: PortalSidebarContext,
) => React.ReactNode;
