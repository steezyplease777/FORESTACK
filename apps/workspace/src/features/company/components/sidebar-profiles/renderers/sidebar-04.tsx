// @ts-nocheck

import { Link } from "@tanstack/react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarGroupContent,
} from "@/components/ui/sidebar";

import type {
  FooterItem,
  NavItem,
  NavSection,
  PortalSidebarContext,
  PortalSidebarSchema,
  SidebarBrand,
} from "../schema";

/**
 * Renderer that reproduces the shadcn `sidebar-04` block's
 * information design (labeled groups + nested submenus) inside
 * our existing inset shell.
 *
 *   sidebar-04 as published:      variant="floating", docs-style nav
 *   sidebar-04 as rendered here:  variant="inset",    same structure
 *
 * We stick with `inset` because the portal shell's rounded content
 * card is keyed off `peer-data-[variant=inset]`; switching to
 * floating would break the rounded-card alignment. The *character*
 * of sidebar-04 — visible group labels, nested submenus via
 * `SidebarMenuSub` — transfers cleanly either way and is what
 * actually differentiates it from the flat default renderer.
 *
 * Schema fields this renderer honors:
 *   - `brand`                → same as default; `custom` pass-through
 *                              or chip built from `title`/`subtitle`.
 *   - `nav[].label`          → rendered as `<SidebarGroupLabel>`.
 *   - `nav[].items`          → top-level `<SidebarMenuButton>` per
 *                              item. `icon` still shown (the shadcn
 *                              block omits icons for docs nav; our
 *                              app nav benefits from them).
 *   - `item.items`           → nested links under `<SidebarMenuSub>`.
 *   - `chrome.contentClassName` → merged into `<SidebarContent>`.
 *
 * Degradation: schemas with no group labels render as unlabeled
 * groups; items with no sub-items render with no submenu. A schema
 * built for the default renderer will still produce a usable
 * (though less expressive) rail here.
 */

const BASE_CLASSNAME =
  "top-(--header-height) h-[calc(100svh-var(--header-height))]!";

export function sidebar04Renderer(
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

  const Icon = brand.icon;
  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild>
            <Link
              to={
                brand.url
                  ? `/${ctx.companySlug}/${brand.url}`
                  : `/${ctx.companySlug}`
              }
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
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
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
    <SidebarGroup>
      {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {section.items.map((item) => (
          <TopLevelItem key={item.url} item={item} ctx={ctx} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function TopLevelItem({
  item,
  ctx,
}: {
  item: NavItem;
  ctx: PortalSidebarContext;
}) {
  const href = resolveHref(item.url, ctx.companySlug);
  const isActive = matchActive(ctx.pathname, href, item.activeMatch);
  const hasSub = !!item.items?.length;
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.tooltip ?? item.title}
        isActive={isActive && !hasSub}
      >
        <Link to={href}>
          {Icon ? <Icon className="size-4" /> : null}
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {hasSub ? (
        <SidebarMenuSub>
          {item.items!.map((sub) => {
            const subHref = resolveHref(sub.url, ctx.companySlug);
            const subActive = matchActive(
              ctx.pathname,
              subHref,
              sub.activeMatch,
            );
            return (
              <SidebarMenuSubItem key={sub.url}>
                <SidebarMenuSubButton asChild isActive={subActive}>
                  <Link to={subHref}>
                    <span>{sub.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      ) : null}
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
/*  Helpers (duplicated from default.tsx on purpose — renderers are meant     */
/*  to be self-contained so adding a new one never requires touching another) */
/* -------------------------------------------------------------------------- */

function resolveHref(url: string, companySlug: string): string {
  if (url.startsWith("#") || url.startsWith("http")) return url;
  if (url.startsWith("/")) return url;
  return `/${companySlug}/${url}`;
}

function matchActive(
  pathname: string,
  href: string,
  rule: "exact" | "prefix" = "prefix",
): boolean {
  if (rule === "exact") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
