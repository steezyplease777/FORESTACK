// @ts-nocheck

import { IconHelp, IconSettings } from "@tabler/icons-react";

import { ModuleSwitcher } from "@/features/company/components/module-switcher";
import type { PortalSidebarSchema, PortalSlug } from "@/features/company/components/sidebar-profiles/schema";
import {
  HOME_NAV_ITEMS,
  getModuleDefinition,
  getModuleNavItems,
} from "@/config/modules.registry";

const HOME_CONTENT_CLASSNAME =
  "group-data-[collapsible=icon]:overflow-x-hidden! group-data-[collapsible=icon]:overflow-y-auto! [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

/**
 * Derive a `PortalSidebarSchema` from the unified module registry.
 * Home and every module portal share one factory so nav + brand stay
 * in sync with `modules.registry.ts`.
 */
export function schemaFromModule(portal: PortalSlug): PortalSidebarSchema {
  if (portal === "home") {
    return {
      brand: {
        kind: "custom",
        render: () => <ModuleSwitcher moduleSlug="home" />,
      },
      nav: [
        {
          kind: "items",
          items: HOME_NAV_ITEMS.map((item) => ({
            title: item.title,
            url: item.url,
            icon: item.icon,
          })),
        },
      ],
      footer: [
        {
          kind: "link",
          title: "Help",
          icon: IconHelp,
          url: "#",
        },
      ],
      chrome: {
        contentClassName: HOME_CONTENT_CLASSNAME,
      },
    };
  }

  const navItems = getModuleNavItems(portal) ?? [];
  const def = getModuleDefinition(portal);

  const mapNavItem = (item: (typeof navItems)[number]) => ({
    title: item.title,
    url: item.url,
    icon: item.icon,
    activeMatch:
      item.activeMatch ?? (item.url === portal ? "exact" : "prefix"),
    items: item.items?.map(mapNavItem),
  });

  return {
    brand: {
      kind: "custom",
      render: () => <ModuleSwitcher moduleSlug={portal} />,
    },
    nav: [
      {
        kind: "items",
        label: def?.shortLabel,
        items: navItems.map(mapNavItem),
      },
    ],
    footer: [
      {
        kind: "link",
        title: "Portal settings",
        icon: IconSettings,
        onClick: () => {
          /* TODO: open portal settings modal/page */
        },
      },
    ],
  };
}
