import { Building2, Settings, Users, type LucideIcon } from "lucide-react";

export type SaasTabId = "dashboard" | "companies" | "users" | "settings";

export type SaasTabDefinition = {
  id: SaasTabId;
  label: string;
  to:
    | "/app/org/$orgId/dashboard"
    | "/app/org/$orgId/companies"
    | "/app/org/$orgId/users"
    | "/app/org/$orgId/settings";
  icon?: LucideIcon;
};

export const SAAS_TABS: SaasTabDefinition[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/app/org/$orgId/dashboard",
  },
  {
    id: "companies",
    label: "Companies",
    to: "/app/org/$orgId/companies",
    icon: Building2,
  },
  {
    id: "users",
    label: "Users",
    to: "/app/org/$orgId/users",
    icon: Users,
  },
  {
    id: "settings",
    label: "Settings",
    to: "/app/org/$orgId/settings",
    icon: Settings,
  },
];

/** @deprecated Use `SaasTabId` — kept for `WorkspaceShell` callers. */
export type WorkspaceTab = SaasTabId;
