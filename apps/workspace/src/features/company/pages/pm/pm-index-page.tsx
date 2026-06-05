// @ts-nocheck
import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  IconCalendar,
  IconChevronRight,
  IconFolder,
  IconLayoutGrid,
  IconPalette,
  IconPlus,
  IconSpeakerphone,
  IconTrendingUp,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { usePmBundle } from "@/lib/data/portal-bundles/pm/hooks";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { PmBundleCampaign } from "@/lib/data/portal-bundles/pm/types";

/**
 * PM module overview.
 *
 * Lands on `/pm` and is the single dashboard-style landing page for
 * the Project Management portal. All data here is sourced from the
 * per-portal `usePmBundle()` query (the bundle pattern shared with
 * every other portal) so the dashboard never flickers independently
 * from the sidebar shell — the bundle is prefetched in the route
 * loader and pinned for the session.
 */
export function PmOverviewPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const bundleQuery = usePmBundle(companySlug);
  const bundle = bundleQuery.data;

  const newCampaignHref = `${basePath}/pm/campaigns/new`;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Project Management"
        description="Campaigns, projects, and colorways — your program roadmap at a glance."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`${basePath}/pm/campaigns`}>
                <IconSpeakerphone className="size-4" />
                View Campaigns
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={newCampaignHref}>
                <IconPlus className="size-4" />
                New Campaign
              </Link>
            </Button>
          </>
        }
      />

      <StatGrid
        metrics={bundle?.metrics}
        isLoading={bundleQuery.isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <RecentCampaignsCard
          campaigns={bundle?.recentCampaigns ?? []}
          totalCount={bundle?.metrics.campaignCount ?? 0}
          isLoading={bundleQuery.isLoading}
          error={bundleQuery.error}
          basePath={basePath}
          newCampaignHref={newCampaignHref}
        />
        <QuickLinksColumn basePath={basePath} />
      </div>
    </div>
  );
}

type StatCardDef = {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
};

function StatGrid({
  metrics,
  isLoading,
}: {
  metrics:
    | {
        campaignCount: number;
        projectCount: number;
        categoryCount: number;
        colorwayCount: number;
        projectTaskCount: number;
        openTaskCount: number;
      }
    | undefined;
  isLoading: boolean;
}) {
  const cards: StatCardDef[] = [
    {
      label: "Campaigns",
      value: (metrics?.campaignCount ?? 0).toLocaleString(),
      hint: "Active and archived seasonal programs",
      icon: <IconSpeakerphone className="size-4" />,
    },
    {
      label: "Projects",
      value: (metrics?.projectCount ?? 0).toLocaleString(),
      hint: "Initiatives tracked across all campaigns",
      icon: <IconFolder className="size-4" />,
    },
    {
      label: "Colorways",
      value: (metrics?.colorwayCount ?? 0).toLocaleString(),
      hint: "Color variants across every campaign",
      icon: <IconPalette className="size-4" />,
    },
    {
      label: "Categories",
      value: (metrics?.categoryCount ?? 0).toLocaleString(),
      hint: "Campaign categories configured for this company",
      icon: <IconLayoutGrid className="size-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-md border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary ring-1 ring-primary/10">
              {card.icon}
            </div>
          </div>
          <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
            {isLoading ? (
              <span className="inline-block h-8 w-16 animate-pulse rounded-md bg-muted" />
            ) : (
              card.value
            )}
          </div>
          <p className="mt-1.5 line-clamp-1 text-xs text-muted-foreground">
            {card.hint}
          </p>
        </div>
      ))}
    </div>
  );
}

function RecentCampaignsCard({
  campaigns,
  totalCount,
  isLoading,
  error,
  basePath,
  newCampaignHref,
}: {
  campaigns: PmBundleCampaign[];
  totalCount: number;
  isLoading: boolean;
  error: unknown;
  basePath: string;
  newCampaignHref: string;
}) {
  return (
    <section className="lg:col-span-2">
      <header className="mb-3 flex items-start justify-between gap-3 border-b pb-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Recent campaigns</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            The latest seasonal programs added to this company.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0">
          <Link to={`${basePath}/pm/campaigns`}>
            View all
            <IconChevronRight className="size-4" />
          </Link>
        </Button>
      </header>

      {isLoading ? (
        <RecentCampaignsSkeleton />
      ) : error ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm font-medium text-destructive">
            Couldn't load campaigns
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="py-8 text-center">
          <IconSpeakerphone className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium">No campaigns yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first campaign to kick off a program.
          </p>
          <Button size="sm" variant="outline" className="mt-4" asChild>
            <Link to={newCampaignHref}>
              <IconPlus className="size-4" />
              New campaign
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-right">Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} className="h-14">
                  <TableCell>
                    <Link
                      to={`${basePath}/pm/campaigns/${c.id}`}
                      className="flex items-center gap-3"
                    >
                      {c.campaign_image_url ? (
                        <img
                          src={c.campaign_image_url}
                          alt=""
                          className="size-9 shrink-0 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <IconSpeakerphone className="size-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium hover:underline">
                          {c.name}
                        </div>
                        {c.campaign_code ? (
                          <div className="font-mono text-xs text-muted-foreground">
                            {c.campaign_code}
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    {c.category?.name ? (
                      <Badge variant="secondary">{c.category.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <IconCalendar className="size-3.5" />
                      {formatRange(c.start_date, c.end_date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                    {new Date(c.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && campaigns.length > 0 && totalCount > campaigns.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {campaigns.length} of {totalCount}
        </p>
      ) : null}
    </section>
  );
}

function RecentCampaignsSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-md border bg-muted/40 p-3"
        >
          <div className="size-9 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function formatRange(start: string | null, end: string | null): string {
  const s = start ? new Date(start).toLocaleDateString() : null;
  const e = end ? new Date(end).toLocaleDateString() : null;
  if (s && e) return `${s} → ${e}`;
  if (s) return `Starts ${s}`;
  if (e) return `Ends ${e}`;
  return "—";
}

type QuickLink = {
  title: string;
  description: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function QuickLinksColumn({ basePath }: { basePath: string }) {
  const quickLinks: QuickLink[] = [
    {
      title: "Campaigns",
      description: "Seasonal programs & briefs",
      url: `${basePath}/pm/campaigns`,
      icon: IconSpeakerphone,
    },
    {
      title: "Projects",
      description: "Initiatives across campaigns",
      url: `${basePath}/pm/projects`,
      icon: IconFolder,
    },
  ];

  return (
    <section>
      <header className="mb-3 border-b pb-2">
        <h3 className="text-sm font-semibold">Jump to</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Deep views inside the PM module.
        </p>
      </header>
      <div className="flex flex-col gap-2">
        {quickLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <React.Fragment key={link.url}>
              {idx > 0 ? <Separator /> : null}
              <Link
                to={link.url}
                className="group -mx-3 flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{link.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {link.description}
                  </div>
                </div>
                <IconChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
        <IconTrendingUp className="size-4" />
        Projects surface coming online next.
      </div>
    </section>
  );
}
