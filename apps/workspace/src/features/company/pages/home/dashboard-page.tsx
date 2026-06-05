// @ts-nocheck

import { useState, useTransition } from "react";
import {
  IconShoppingCart,
  IconBox,
  IconSpeakerphone,
} from "@tabler/icons-react";
import { OrdersDashboard } from "@/features/company/modules/home/dashboard/orders-dashboard";
import { useCompany } from "@/features/company/tenant-provider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DASHBOARD_VIEWS = [
  { id: "orders", label: "Orders", icon: IconShoppingCart },
  { id: "products", label: "Products", icon: IconBox },
  { id: "campaigns", label: "Campaigns", icon: IconSpeakerphone },
] as const;

type DashboardView = (typeof DASHBOARD_VIEWS)[number]["id"];

export function DashboardPage() {
  const [activeView, setActiveView] = useState<DashboardView>("orders");
  // Switching tabs tears down / remounts a heavy subtree (recharts,
  // dnd-kit data table, stat cards). Running that inside the click
  // handler produced a "'click' handler took 151ms" violation. Marking
  // the state update as a transition lets React commit the swap in a
  // low-priority render pass so the click handler itself stays cheap.
  const [, startTransition] = useTransition();
  const { company, companySlug } = useCompany();
  const companyId = company.companyId;

  if (!companyId) return null;

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6">
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Key metrics across orders, products, and campaigns.
          </p>
        </div>
        <Tabs
          value={activeView}
          onValueChange={(v) =>
            startTransition(() => setActiveView(v as DashboardView))
          }
        >
          <TabsList className="h-9">
            {DASHBOARD_VIEWS.map((view) => (
              <TabsTrigger
                key={view.id}
                value={view.id}
                className="gap-1.5 px-3 text-sm"
              >
                <view.icon className="size-4" />
                <span className="hidden sm:inline">{view.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {activeView === "orders" && (
        <OrdersDashboard companySlug={companySlug} />
      )}

      {activeView === "products" && (
        <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground lg:px-6">
          Products dashboard coming soon
        </div>
      )}

      {activeView === "campaigns" && (
        <div className="flex items-center justify-center px-4 py-16 text-sm text-muted-foreground lg:px-6">
          Campaigns dashboard coming soon
        </div>
      )}
    </div>
  );
}
