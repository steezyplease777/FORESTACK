// @ts-nocheck

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { IconLoader2 } from "@tabler/icons-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import type { OrderTimeSeries } from "@/lib/data/dashboard/types";

const PALETTE = [
  "var(--chart-1, hsl(221 83% 53%))",
  "var(--chart-2, hsl(160 60% 45%))",
  "var(--chart-3, hsl(30 80% 55%))",
  "var(--chart-4, hsl(280 65% 60%))",
  "var(--chart-5, hsl(350 65% 55%))",
  "var(--chart-6, hsl(190 70% 50%))",
  "var(--chart-7, hsl(45 85% 50%))",
  "var(--chart-8, hsl(250 50% 65%))",
];

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const TIME_RANGES = [
  { value: "all", days: 0, label: "All time" },
  { value: "1y", days: 365, label: "Last year" },
  { value: "90d", days: 90, label: "Last 3 months" },
  { value: "30d", days: 30, label: "Last 30 days" },
  { value: "7d", days: 7, label: "Last 7 days" },
] as const;

type Props = {
  timeSeries: OrderTimeSeries | undefined;
  isLoading: boolean;
  days: number | null;
  onDaysChange: (days: number) => void;
};

export function OrdersChart({ timeSeries, isLoading, days, onDaysChange }: Props) {
  const timeRange = TIME_RANGES.find((t) => t.days === days)?.value ?? "90d";
  const activeLabel = TIME_RANGES.find((t) => t.days === days)?.label ?? "";

  function handleTimeRangeChange(value: string) {
    const range = TIME_RANGES.find((t) => t.value === value);
    if (range) onDaysChange(range.days);
  }

  const channelNames = React.useMemo(
    () => (timeSeries?.channels ?? []).map((c) => c.name),
    [timeSeries?.channels]
  );

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      orders: { label: "Orders" },
    };
    channelNames.forEach((name, i) => {
      cfg[name] = {
        label: toTitleCase(name),
        color: PALETTE[i % PALETTE.length],
      };
    });
    return cfg;
  }, [channelNames]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Orders Over Time</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Order count by channel — {activeLabel.toLowerCase()}
          </span>
          <span className="@[540px]/card:hidden">
            {activeLabel}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={handleTimeRangeChange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            {TIME_RANGES.map((t) => (
              <ToggleGroupItem key={t.value} value={t.value}>
                {t.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {TIME_RANGES.map((t) => (
                <SelectItem
                  key={t.value}
                  value={t.value}
                  className="rounded-lg"
                >
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-[250px] items-center justify-center">
            <IconLoader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={timeSeries?.data ?? []}>
              <defs>
                {channelNames.map((name, i) => (
                  <linearGradient
                    key={name}
                    id={`fill-${name.replace(/\s+/g, "-")}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={PALETTE[i % PALETTE.length]}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={PALETTE[i % PALETTE.length]}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-fit text-[11px]"
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              {channelNames.map((name, i) => (
                <Area
                  key={name}
                  dataKey={name}
                  type="monotone"
                  fill={`url(#fill-${name.replace(/\s+/g, "-")})`}
                  stroke={PALETTE[i % PALETTE.length]}
                  strokeWidth={1.5}
                  stackId="a"
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
