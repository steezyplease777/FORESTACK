// @ts-nocheck
import {
  IconDashboard,
  IconHome,
  IconInbox,
  IconPackage,
  IconSubtask,
  IconUsers,
  IconUsersGroup,
  IconFileInvoice,
  IconClipboardList,
  IconCube,
  IconBuildingWarehouse,
  IconArrowsTransferDown,
  IconTruckDelivery,
  IconAddressBook,
  IconBuildingStore,
  IconShoppingCart,
  IconSpeakerphone,
  IconFolder,
  IconBoxMultiple,
  IconChartBar,
  IconGitPullRequest,
  IconCash,
  IconReceipt,
  type Icon,
} from "@tabler/icons-react";

import type { NavItem } from "@/lib/navigation/types";

export type ModuleTheme = {
  bg: string;
  text: string;
  ring: string;
};

export type ModuleDefinition = {
  id: string;
  name: string;
  shortLabel: string;
  description: string;
  icon: Icon;
  slug: string;
  theme: ModuleTheme;
};

export type ModuleRegistryEntry = ModuleDefinition & {
  navItems: NavItem[];
};

export const HOME_NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", url: "dashboard", icon: IconDashboard },
  { title: "Team", url: "team", icon: IconUsersGroup },
  { title: "Tasks", url: "tasks", icon: IconSubtask },
  { title: "Inbox", url: "inbox", icon: IconInbox },
];

/** Home portal — not listed in `listModules()` but available via `getHomeDefinition()`. */
export const HOME_DEFINITION: ModuleRegistryEntry = {
  id: "home",
  name: "Home",
  shortLabel: "Home",
  description: "Dashboard & team",
  icon: IconHome,
  slug: "home",
  theme: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200" },
  navItems: HOME_NAV_ITEMS,
};

const MODULE_ENTRIES: ModuleRegistryEntry[] = [
  {
    id: "wms",
    name: "Warehouse Management System",
    shortLabel: "Warehouse",
    description: "Manage inventory, orders, and allocations",
    icon: IconBuildingWarehouse,
    slug: "wms",
    theme: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-100" },
    navItems: [
      { title: "Overview", url: "wms", icon: IconChartBar },
      {
        title: "Allocations",
        url: "wms/allocation",
        icon: IconArrowsTransferDown,
      },
      { title: "Inventory", url: "wms/inventory", icon: IconPackage },
      { title: "Orders", url: "wms/orders", icon: IconTruckDelivery },
    ],
  },
  {
    id: "crm",
    name: "Customer Relationship",
    shortLabel: "Customers",
    description: "Manage customers, contacts, and accounts",
    icon: IconUsers,
    slug: "crm",
    theme: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      ring: "ring-emerald-100",
    },
    navItems: [
      { title: "Overview", url: "crm", icon: IconChartBar },
      { title: "Customers", url: "crm/customers", icon: IconUsers },
      {
        title: "Allocation Orders",
        url: "crm/allocation-orders",
        icon: IconArrowsTransferDown,
      },
      { title: "Contacts", url: "crm/contacts", icon: IconAddressBook },
    ],
  },
  {
    id: "erp",
    name: "ERP",
    shortLabel: "ERP",
    description: "Purchase orders, vendors, and sales channels",
    icon: IconFileInvoice,
    slug: "erp",
    theme: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      ring: "ring-amber-100",
    },
    navItems: [
      { title: "Overview", url: "erp", icon: IconChartBar },
      {
        title: "Purchase Orders",
        url: "erp/purchase-orders",
        icon: IconFileInvoice,
      },
      {
        title: "Allocation Requests",
        url: "erp/allocation-requests",
        icon: IconGitPullRequest,
      },
      { title: "Vendors", url: "erp/vendors", icon: IconBuildingStore },
      {
        title: "Sales Channels",
        url: "erp/sales-channels",
        icon: IconShoppingCart,
      },
      {
        title: "Finance",
        url: "erp/finance/expenses",
        icon: IconCash,
        items: [
          {
            title: "Expenses",
            url: "erp/finance/expenses",
            icon: IconReceipt,
          },
        ],
      },
    ],
  },
  {
    id: "pm",
    name: "Project Management",
    shortLabel: "Projects",
    description: "Campaigns, projects, and timelines",
    icon: IconClipboardList,
    slug: "pm",
    theme: {
      bg: "bg-violet-50",
      text: "text-violet-600",
      ring: "ring-violet-100",
    },
    navItems: [
      { title: "Overview", url: "pm", icon: IconChartBar },
      { title: "Campaigns", url: "pm/campaigns", icon: IconSpeakerphone },
      { title: "Projects", url: "pm/projects", icon: IconFolder },
    ],
  },
  {
    id: "plm",
    name: "Product Lifecycle",
    shortLabel: "Product Lifecycle",
    description: "Products, variants, and media",
    icon: IconCube,
    slug: "plm",
    theme: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      ring: "ring-rose-100",
    },
    navItems: [
      { title: "Overview", url: "plm", icon: IconChartBar },
      { title: "Products", url: "plm/products", icon: IconCube },
      { title: "Variants", url: "plm/variants", icon: IconBoxMultiple },
      { title: "Sourcing", url: "plm/sourcing", icon: IconTruckDelivery },
    ],
  },
];

/** @deprecated Use `MODULE_REGISTRY` — kept for backward compatibility. */
export const MODULE_DEFINITIONS: ModuleDefinition[] = MODULE_ENTRIES;

export const MODULE_REGISTRY: Record<string, ModuleRegistryEntry> =
  Object.fromEntries(MODULE_ENTRIES.map((entry) => [entry.slug, entry]));

export function getModuleNavItems(moduleSlug: string): NavItem[] | null {
  return MODULE_REGISTRY[moduleSlug]?.navItems ?? null;
}

export function getModuleDefinition(
  moduleSlug: string,
): ModuleDefinition | null {
  if (moduleSlug === "home") return HOME_DEFINITION;
  return MODULE_REGISTRY[moduleSlug] ?? null;
}

export function getHomeDefinition(): ModuleRegistryEntry {
  return HOME_DEFINITION;
}

export function listModules(): ModuleRegistryEntry[] {
  return MODULE_ENTRIES;
}
