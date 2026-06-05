// @ts-nocheck

import {
  IconCurrencyDollar,
  IconLoader2,
  IconShoppingCart,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import type { DashboardStats } from "@/lib/data/dashboard/types";

export type StatCardDef = {
  label: string;
  getValue: (stats: DashboardStats) => string;
  getSubtext: (stats: DashboardStats) => string;
  icon: React.ReactNode;
};

const defaultCards: StatCardDef[] = [
  {
    label: "Revenue (7d)",
    getValue: (s) =>
      s.revenue7d.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
      }),
    getSubtext: () => "Total order revenue last 7 days",
    icon: <IconCurrencyDollar className="size-4" />,
  },
  {
    label: "Orders (7d)",
    getValue: (s) => s.orderCount7d.toLocaleString(),
    getSubtext: () => "Orders placed last 7 days",
    icon: <IconShoppingCart className="size-4" />,
  },
];

type Props = {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  cards?: StatCardDef[];
};

export function DashboardStatCards({
  stats,
  isLoading,
  cards = defaultCards,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="@container/card shadow-xs transition-colors hover:border-primary/20"
        >
          <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
            <CardDescription className="text-xs font-medium text-muted-foreground">
              {card.label}
            </CardDescription>
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/5 text-primary ring-1 ring-primary/10">
              {card.icon}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums tracking-tight">
              {isLoading ? (
                <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
              ) : stats ? (
                card.getValue(stats)
              ) : (
                "—"
              )}
            </div>
            <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
              {stats && !isLoading ? card.getSubtext(stats) : "\u00A0"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
