// @ts-nocheck
"use client"

import { Link } from "@tanstack/react-router"
import { useLocation } from "@tanstack/react-router"; const usePathname = () => useLocation().pathname;
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
  label = "Modules",
}: {
  items: {
    name: string
    url: string
    icon: Icon
  }[]
  label?: string
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {/*
       * The label hides itself when the sidebar collapses to icons
       * (via `SidebarGroupLabel`'s `group-data-[collapsible=icon]:opacity-0`),
       * while each item stays visible as a plain icon with a tooltip.
       */}
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive =
            pathname === item.url || pathname.startsWith(`${item.url}/`)
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                size="sm"
                tooltip={item.name}
              >
                <Link to={item.url}>
                  <item.icon className="size-3.5" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
