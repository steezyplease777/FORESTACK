// @ts-nocheck

import { Link } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router"; const usePathname = () => useLocation().pathname;
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Icon } from "@tabler/icons-react";

type SidebarNavItem = {
  title: string;
  url: string;
  icon: Icon;
  tooltip?: string;
};

export function CompanyNavMain({
  items,
}: {
  items: SidebarNavItem[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);
            const ItemIcon = item.icon;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.tooltip ?? item.title}
                  isActive={isActive}
                >
                  <Link to={item.url}>
                    <ItemIcon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
