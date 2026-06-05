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
import type { NavItem } from "@/lib/navigation/types";

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
 * Derive breadcrumbs from the current pathname.
 *
 * Shape: `/<companySlug>/<portal>/<...page>`
 *   - `erp/finance/expenses` -> [ERP, Finance, Expenses]
 *   - `erp/purchase-orders`  -> [ERP, Purchase Orders]
 *   - `crm/customers/:id`    -> [Customers, Customers] + optional tail
 *   - `dashboard`            -> [Home, Dashboard]
 *
 * Labels come from `modules.registry.ts` nav titles (including nested
 * `items`). Unknown segments fall back to title-cased slugs.
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

  const withTail = (crumbs: Crumb[]): Crumb[] => {
    if (!tail) return crumbs;
    if (crumbs.length === 0) return [{ label: tail }];
    const head = crumbs.slice(0, -1);
    const last = crumbs[crumbs.length - 1];
    const lastLinked: Crumb = {
      ...last,
      href: last.href ?? inferListHref(pathname, companySlug),
    };
    return [...head, lastLinked, { label: tail }];
  };

  if (rest.length === 0) return withTail([{ label: "Home" }]);

  const first = rest[0];
  const moduleDef = getModuleDefinition(first);

  if (!moduleDef) {
    const homeItem = HOME_NAV_ITEMS.find((item) => item.url === first);
    return withTail([
      { label: "Home", href: `${base}/dashboard` },
      {
        label: homeItem?.title ?? titleCase(first),
      },
    ]);
  }

  if (rest.length === 1) {
    return withTail([{ label: moduleDef.shortLabel }]);
  }

  const subPath = rest.join("/");
  const navItems = getModuleNavItems(first) ?? [];
  const navTrail = resolveNavTrail(navItems, subPath, base);

  return withTail([
    { label: moduleDef.shortLabel, href: `${base}/${first}` },
    ...navTrail,
  ]);
}

/** Map nav items to crumbs with tenant-scoped hrefs. */
function navItemsToCrumbs(items: NavItem[], base: string): Crumb[] {
  return items.map((item) => ({
    label: item.title,
    href: `${base}/${item.url}`,
  }));
}

/**
 * Resolve the nav-derived portion of a breadcrumb trail for a module
 * sub-path. Walks nested `items` for grouped sidebar entries (e.g.
 * Finance → Expenses), then falls back to longest-prefix match for
 * detail routes, then to title-cased URL segments.
 */
function resolveNavTrail(
  navItems: NavItem[],
  subPath: string,
  base: string,
): Crumb[] {
  const exact = findExactNavTrail(navItems, subPath);
  if (exact.length > 0) return navItemsToCrumbs(exact, base);

  const prefix = findPrefixNavTrail(navItems, subPath);
  if (prefix.length > 0) return navItemsToCrumbs(prefix, base);

  return fallbackSegmentCrumbs(subPath, base);
}

/** Exact URL match, including parent + child when both share a URL. */
function findExactNavTrail(
  navItems: NavItem[],
  subPath: string,
  ancestors: NavItem[] = [],
): NavItem[] {
  for (const item of navItems) {
    if (item.url === subPath) {
      const childWithSameUrl = item.items?.find((child) => child.url === subPath);
      const chain = childWithSameUrl
        ? [...ancestors, item, childWithSameUrl]
        : [...ancestors, item];
      return chain;
    }
    if (item.items?.length) {
      const nested = findExactNavTrail(item.items, subPath, [...ancestors, item]);
      if (nested.length > 0) return nested;
    }
  }
  return [];
}

/** Longest nav URL that is a prefix of `subPath` (detail / nested routes). */
function findPrefixNavTrail(
  navItems: NavItem[],
  subPath: string,
  ancestors: NavItem[] = [],
): NavItem[] {
  let best: { trail: NavItem[]; urlLen: number } | null = null;

  for (const item of navItems) {
    const chain = [...ancestors, item];
    if (subPath === item.url || subPath.startsWith(`${item.url}/`)) {
      if (!best || item.url.length > best.urlLen) {
        best = { trail: chain, urlLen: item.url.length };
      }
    }
    if (item.items?.length) {
      const nested = findPrefixNavTrail(item.items, subPath, chain);
      if (nested.length > 0) {
        const nestedLeaf = nested[nested.length - 1];
        if (!best || nestedLeaf.url.length > best.urlLen) {
          best = { trail: nested, urlLen: nestedLeaf.url.length };
        }
      }
    }
  }

  return best?.trail ?? [];
}

/** Title-case each segment after the module slug when nav lookup misses. */
function fallbackSegmentCrumbs(subPath: string, base: string): Crumb[] {
  const parts = subPath.split("/");
  const moduleSlug = parts[0];
  const segments = parts.slice(1);
  if (segments.length === 0) return [];

  return segments.map((segment, index) => {
    const partialPath = [moduleSlug, ...segments.slice(0, index + 1)].join("/");
    return {
      label: titleCase(segment),
      href: `${base}/${partialPath}`,
    };
  });
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
