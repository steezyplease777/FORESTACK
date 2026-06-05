// @ts-nocheck
"use client";

import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  HOME_NAV_ITEMS,
  getModuleDefinition,
  getModuleNavItems,
} from "@/config/modules.registry";
import { useCompany } from "@/features/company/tenant-provider";
import { usePageBreadcrumbTail } from "@/features/company/components/header/page-breadcrumb-context";

/**
 * Per-page sub-header that sits at the top of every portal's
 * `SidebarInset`. Matches the shadcn `sidebar-08` pattern:
 *
 *   [☰ Sidebar Trigger] │ Portal name › Page name
 *
 * Rendered once in `PortalShell` so every page inherits it without
 * opting in. Breadcrumbs are derived from the current URL — the portal
 * segment maps to a module definition (or "Home"), and the remaining
 * segment maps to a nav-item title. Pages that need a custom breadcrumb
 * trail (e.g. a detail page) can render their own bar and hide this
 * one later via a context hook; kept minimal for now since most pages
 * are covered by URL-based inference.
 */
export function PortalPageHeader() {
  const { companySlug } = useCompany();
  const pathname = useLocation({ select: (l) => l.pathname });
  const tail = usePageBreadcrumbTail();

  const crumbs = buildBreadcrumbs(pathname, companySlug, tail);

  return (
    <header className="relative z-30 flex h-(--portal-page-header-height) shrink-0 items-center gap-2 border-b bg-background px-3 md:rounded-t-[28px] md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.label}-${i}`}>
                <BreadcrumbItem
                  className={i === 0 ? "hidden md:block" : undefined}
                >
                  {isLast || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link to={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast ? (
                  <BreadcrumbSeparator
                    className={i === 0 ? "hidden md:block" : undefined}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}

type Crumb = { label: string; href?: string };

/**
 * Derive a two-level breadcrumb from the pathname.
 *
 * Shape: `/<companySlug>/<portal>/<...page>`
 *   - `wms/inventory`  -> [Warehouse, Inventory]
 *   - `crm/customers/:id` -> [Customers, Customers]  (detail falls back to parent label)
 *   - `dashboard`     -> [Home, Dashboard]
 *   - `/<companySlug>` (bare) -> [Home]
 *
 * Unknown segments fall back to a title-cased version of the raw slug
 * so we never render a blank crumb.
 */
function buildBreadcrumbs(
  pathname: string,
  companySlug: string,
  tail: string | null,
): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const slugIndex = segments.indexOf(companySlug);
  const rest =
    slugIndex >= 0 ? segments.slice(slugIndex + 1) : segments;

  const base = `/${companySlug}`;

  // Append a page-registered tail (e.g. detail page's entity name)
  // after the URL-derived trail, promoting the previously-last crumb
  // to a link back to its list. No-op when `tail` is null.
  const withTail = (crumbs: Crumb[]): Crumb[] => {
    if (!tail) return crumbs;
    if (crumbs.length === 0) return [{ label: tail }];
    const head = crumbs.slice(0, -1);
    const last = crumbs[crumbs.length - 1];
    // Synthesize an href for the last crumb if it didn't already have
    // one so users can click back to the list from the detail view.
    const lastLinked: Crumb = {
      ...last,
      href: last.href ?? inferListHref(pathname, companySlug),
    };
    return [...head, lastLinked, { label: tail }];
  };

  if (rest.length === 0) return withTail([{ label: "Home" }]);

  const first = rest[0];
  const moduleDef = getModuleDefinition(first);

  // Home portal pages live at /:companySlug/<page> (no "home" in URL).
  if (!moduleDef) {
    const homeItem = HOME_NAV_ITEMS.find((item) => item.url === first);
    return withTail([
      { label: "Home", href: `${base}/dashboard` },
      {
        label: homeItem?.title ?? titleCase(first),
      },
    ]);
  }

  // Module overview = /:companySlug/<module> (no subpage).
  if (rest.length === 1) {
    return withTail([{ label: moduleDef.shortLabel }]);
  }

  // Module sub-page: look up from the module's nav items. Detail routes
  // (e.g. /customers/:id) inherit the nearest parent nav item's title.
  const subPath = rest.join("/"); // e.g. "wms/inventory"
  const navItems = getModuleNavItems(first) ?? [];
  const matched =
    navItems.find((item) => item.url === subPath) ??
    navItems
      .slice()
      .sort((a, b) => b.url.length - a.url.length)
      .find((item) => subPath.startsWith(`${item.url}/`));

  // If we matched a parent nav item (detail route case), give the
  // parent crumb an href so it becomes a real "back to list" link
  // once a tail is registered.
  const parentHref = matched ? `${base}/${matched.url}` : undefined;

  return withTail([
    { label: moduleDef.shortLabel, href: `${base}/${first}` },
    {
      label: matched?.title ?? titleCase(rest[rest.length - 1]),
      href: parentHref,
    },
  ]);
}

/**
 * Best-effort "list URL" for the current pathname — strips the last
 * path segment. Used only when a tail crumb is registered and the
 * URL-derived parent crumb didn't already carry an href.
 */
function inferListHref(pathname: string, companySlug: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return `/${companySlug}`;
  return "/" + segments.slice(0, -1).join("/");
}

function titleCase(segment: string): string {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
