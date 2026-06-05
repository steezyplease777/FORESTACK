import type * as React from "react";
import type { Icon } from "@tabler/icons-react";

/**
 * Minimal context passed to sidebar schema render fns. Apps extend this
 * with portal-specific fields (e.g. `companySlug`, `portal`).
 */
export type SidebarContext = {
  pathname: string;
};

/* -------------------------------------------------------------------------- */
/*  Nav                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Rule for deciding whether a nav item is the "current" one.
 *
 *   - `"exact"`  : active only when `pathname` equals the resolved href.
 *   - `"prefix"` : active when `pathname` equals or lives beneath the href.
 */
export type ActiveMatch = "exact" | "prefix";

/**
 * A single nav link. `url` is relative to the tenant/app root; renderers
 * prepend the base path so schemas stay tenancy-agnostic.
 */
export type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  /** Long-form label for tooltips; falls back to `title` when omitted. */
  tooltip?: string;
  /** Defaults to `"prefix"`. See `ActiveMatch`. */
  activeMatch?: ActiveMatch;
  /** Sub-items for grouped/collapsible sidebar variants. */
  items?: NavItem[];
};

/**
 * One rail group in the sidebar.
 *
 *   - `"items"`  : declarative list of `NavItem`s, optionally labeled.
 *   - `"custom"` : escape hatch for JSX that isn't expressible as links.
 */
export type NavSection =
  | { kind: "items"; label?: string; items: NavItem[] }
  | { kind: "custom"; render: (ctx: SidebarContext) => React.ReactNode };

/* -------------------------------------------------------------------------- */
/*  Brand + footer                                                             */
/* -------------------------------------------------------------------------- */

export type SidebarBrand =
  | {
      kind: "chip";
      icon: Icon;
      title: string;
      subtitle?: string;
      url?: string;
    }
  | { kind: "custom"; render: (ctx: SidebarContext) => React.ReactNode };

export type FooterItem =
  | {
      kind: "link";
      title: string;
      icon?: Icon;
      tooltip?: string;
      onClick?: () => void;
      url?: string;
    }
  | { kind: "custom"; render: (ctx: SidebarContext) => React.ReactNode };

/* -------------------------------------------------------------------------- */
/*  Schema + renderer                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Declarative description of a sidebar. Data-first — schemas should be
 * cheap to import and safe to memoize.
 */
export type SidebarSchema = {
  brand?: SidebarBrand;
  nav: NavSection[];
  footer?: FooterItem[];
  chrome?: {
    contentClassName?: string;
  };
};

export type SidebarRenderer = (
  schema: SidebarSchema,
  ctx: SidebarContext,
) => React.ReactNode;
