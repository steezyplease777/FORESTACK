// @ts-nocheck

import { Link } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import type {
  FooterItem,
  NavItem,
  NavSection,
  PortalSidebarContext,
  PortalSidebarSchema,
  SidebarBrand,
} from "../schema";

/**
 * "Default" renderer — the visual baseline for this app. Produces
 * the look our portals shipped before the schema refactor:
 *
 *   <Sidebar variant="inset" collapsible="icon">
 *     <SidebarHeader>   brand    </SidebarHeader>
 *     <SidebarContent>
 *       <SidebarGroup>  nav items (one group per section) </SidebarGroup>
 *       …
 *       <SidebarGroup className="mt-auto"> footer </SidebarGroup>
 *     </SidebarContent>
 *   </Sidebar>
 *
 * Flat-style. Section labels are ignored (label-bearing variants
 * live in `sidebar-04.tsx`). Nav item sub-items (`items`) are
 * ignored too — see the comment in `schema.ts`: flat renderers
 * don't silently flatten, to avoid reshaping nav data unexpectedly.
 */

const BASE_CLASSNAME =
  "top-(--header-height) h-[calc(100svh-var(--header-height))]!";

export function defaultRenderer(
  schema: PortalSidebarSchema,
  ctx: PortalSidebarContext,
) {
  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className={BASE_CLASSNAME}
    >
      {renderBrand(schema.brand, ctx)}
      <SidebarContent className={schema.chrome?.contentClassName}>
        {schema.nav.map((section, idx) => (
          <NavSectionRender key={idx} section={section} ctx={ctx} />
        ))}
        {schema.footer && schema.footer.length > 0 ? (
          <SidebarGroup className="mt-auto">
            <SidebarSeparator className="mb-2" />
            <SidebarGroupContent>
              <SidebarMenu>
                {schema.footer.map((item, idx) => (
                  <FooterItemRender key={idx} item={item} ctx={ctx} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
    </Sidebar>
  );
}

/* -------------------------------------------------------------------------- */
/*  Internals                                                                  */
/* -------------------------------------------------------------------------- */

function renderBrand(
  brand: SidebarBrand | undefined,
  ctx: PortalSidebarContext,
) {
  if (!brand) return null;

  if (brand.kind === "custom") return brand.render(ctx);

  // `chip` kind — declarative icon + text header. Wrapped in
  // SidebarHeader to match the spacing/padding the shadcn block
  // uses for its top-of-rail brand area. `ModuleSwitcher` already
  // wraps itself in SidebarHeader, which is why `custom` brands
  // are returned unwrapped above.
  const Icon = brand.icon;
  const chip = (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="lg"
        className="data-[slot=sidebar-menu-button]:!p-1.5"
      >
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <Icon className="size-4" />
        </div>
        <div className="flex flex-col gap-0.5 leading-none">
          <span className="font-medium">{brand.title}</span>
          {brand.subtitle ? (
            <span className="text-muted-foreground text-xs">
              {brand.subtitle}
            </span>
          ) : null}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <SidebarHeader>
      <SidebarMenu>
        {brand.url ? (
          <Link to={`/${ctx.companySlug}/${brand.url}`} className="contents">
            {chip}
          </Link>
        ) : (
          chip
        )}
      </SidebarMenu>
    </SidebarHeader>
  );
}

function NavSectionRender({
  section,
  ctx,
}: {
  section: NavSection;
  ctx: PortalSidebarContext;
}) {
  if (section.kind === "custom") return <>{section.render(ctx)}</>;

  return (
    <SidebarGroup className="pt-3">
      <SidebarGroupContent>
        <SidebarMenu>
          {section.items.map((item) => (
            <NavItemRow key={item.url} item={item} ctx={ctx} />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function NavItemRow({
  item,
  ctx,
}: {
  item: NavItem;
  ctx: PortalSidebarContext;
}) {
  const href = resolveHref(item.url, ctx.companySlug);
  const isActive = matchActive(ctx.pathname, href, item.activeMatch);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.tooltip ?? item.title}
        isActive={isActive}
        className="text-sm"
      >
        <Link to={href}>
          {Icon ? <Icon className="size-4" /> : null}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function FooterItemRender({
  item,
  ctx,
}: {
  item: FooterItem;
  ctx: PortalSidebarContext;
}) {
  if (item.kind === "custom") return <>{item.render(ctx)}</>;

  const Icon = item.icon;
  const label = item.tooltip ?? item.title;

  // Route priority: `onClick` wins if provided, else `url` navigates,
  // else it's a dead affordance (kept so the row has visible intent
  // while the destination is TBD — e.g. "Portal settings").
  if (item.onClick) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          size="sm"
          tooltip={label}
          onClick={item.onClick}
          className="text-muted-foreground"
        >
          {Icon ? <Icon className="size-4" /> : null}
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  if (item.url) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          size="sm"
          tooltip={label}
          className="text-muted-foreground"
        >
          <Link to={resolveHref(item.url, ctx.companySlug)}>
            {Icon ? <Icon className="size-4" /> : null}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        size="sm"
        tooltip={label}
        className="text-muted-foreground"
      >
        {Icon ? <Icon className="size-4" /> : null}
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a schema URL (relative, no leading slash) against the
 * tenant base path. Schemas stay tenant-agnostic; resolution
 * happens here where `companySlug` is known.
 *
 * Bare-absolute hrefs like `"#"` pass through untouched so footer
 * affordances with no destination still render as links.
 */
function resolveHref(url: string, companySlug: string): string {
  if (url.startsWith("#") || url.startsWith("http")) return url;
  if (url.startsWith("/")) return url;
  return `/${companySlug}/${url}`;
}

/**
 * Decide whether `pathname` matches `href` under the chosen rule.
 * `"prefix"` (default) returns true for `href` itself or any
 * descendant. `"exact"` returns true only for identical paths —
 * used for overview items that would otherwise swallow all child
 * routes.
 */
function matchActive(
  pathname: string,
  href: string,
  rule: "exact" | "prefix" = "prefix",
): boolean {
  if (rule === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
