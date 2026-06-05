// @ts-nocheck

import { useLocation } from "@tanstack/react-router";

import { useCompany } from "@/features/company/tenant-provider";

import { defaultRenderer } from "./renderers/default";
import { sidebar04Renderer } from "./renderers/sidebar-04";
import { crmSchema } from "./schemas/crm";
import { erpSchema } from "./schemas/erp";
import { homeSchema } from "./schemas/home";
import { plmSchema } from "./schemas/plm";
import { pmSchema } from "./schemas/pm";
import { wmsSchema } from "./schemas/wms";
import type {
  PortalSidebarContext,
  PortalSidebarSchema,
  PortalSlug,
  SidebarRenderer,
} from "./schema";

export type {
  PortalSidebarContext,
  PortalSidebarSchema,
  PortalSlug,
  SidebarRenderer,
} from "./schema";

/* -------------------------------------------------------------------------- */
/*  Registry                                                                   */
/* -------------------------------------------------------------------------- */

type PortalBinding = {
  schema: PortalSidebarSchema;
  renderer: SidebarRenderer;
};

/**
 * Single source of truth: which {schema, renderer} does each portal use?
 *
 * Schemas and renderers are independent axes. The schema declares
 * what belongs in a portal's sidebar (brand, nav groups, items,
 * footer). The renderer translates that schema into JSX for a
 * particular shadcn variant. Swap either side without touching the
 * other:
 *
 *   // A/B CRM using sidebar-04:
 *   crm: { schema: crmSchema, renderer: sidebar04Renderer },
 *
 *   // New nav for WMS without changing the look:
 *   wms: { schema: wmsExperimentSchema, renderer: defaultRenderer },
 *
 * `Record<PortalSlug, …>` enforces exhaustiveness — adding a new
 * slug to `PortalSlug` without a binding here is a TS error.
 */
const PORTAL_SIDEBAR_REGISTRY: Record<PortalSlug, PortalBinding> = {
  home: { schema: homeSchema, renderer: defaultRenderer },

  // WMS intentionally points at the sidebar-04 renderer as the
  // first live A/B demo. Flip it back to `defaultRenderer` to
  // match the other modules; see `renderers/sidebar-04.tsx` for
  // the tradeoffs.
  wms: { schema: wmsSchema, renderer: sidebar04Renderer },

  crm: { schema: crmSchema, renderer: defaultRenderer },
  erp: { schema: erpSchema, renderer: sidebar04Renderer },
  pm: { schema: pmSchema, renderer: defaultRenderer },
  plm: { schema: plmSchema, renderer: defaultRenderer },
};

/**
 * Direct lookup, exported for tests / Storybook / any surface that
 * wants to render a portal's sidebar outside of `<PortalSidebar>`.
 */
export function resolvePortalSidebar(portal: PortalSlug): PortalBinding {
  return PORTAL_SIDEBAR_REGISTRY[portal];
}

/* -------------------------------------------------------------------------- */
/*  Entry point                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Universal sidebar component for portal routes. Each per-portal
 * sidebar file (`wms-sidebar.tsx`, `crm-sidebar.tsx`, …) collapses
 * to a one-line wrapper around this.
 *
 * Builds `PortalSidebarContext` once — schemas and renderers stay
 * pure — then hands off to the bound renderer. No rendering logic
 * lives here, only wiring.
 */
export function PortalSidebar({ portal }: { portal: PortalSlug }) {
  const { companySlug } = useCompany();
  const pathname = useLocation({ select: (l) => l.pathname });

  const { schema, renderer } = resolvePortalSidebar(portal);
  const ctx: PortalSidebarContext = { portal, companySlug, pathname };

  return <>{renderer(schema, ctx)}</>;
}
