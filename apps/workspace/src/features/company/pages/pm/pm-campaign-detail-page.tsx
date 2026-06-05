// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconCalendar,
  IconChecklist,
  IconFolder,
  IconPalette,
  IconPencil,
  IconPlus,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useCampaign } from "@/lib/data/pm/campaigns/hooks";
import { useProjects } from "@/lib/data/pm/projects/hooks";
import { useCampaignTeams } from "@/lib/data/pm/campaign-teams/hooks";
import { useCampaignTaskRollup } from "@/lib/data/pm/project-tasks/hooks";
import type { PmProjectWithRefs } from "@/lib/data/pm/projects/client";
import { ProjectFormModal } from "@/features/company/modules/pm/projects/project-form-modal";
import { CampaignSettingsModal } from "@/features/company/modules/pm/campaigns/campaign-settings-modal";
import {
  PmAvatarStack,
  PmUserAvatar,
  displayName,
} from "@/features/company/modules/pm/shared/user-avatar";
import { usePageBreadcrumb } from "@/features/company/components/header/page-breadcrumb-context";

const routeApi = getRouteApi(
  "/$companySlug/_authed/pm/campaigns/$campaignId",
);

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function PmCampaignDetailPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { campaignId } = routeApi.useParams();

  const campaignQuery = useCampaign(companyId, campaignId);

  const projectsQuery = useProjects(companyId, {
    scope: { campaignId },
    page: 1,
    pageSize: 10,
  });

  const teamsQuery = useCampaignTeams(campaignId);
  const rollupQuery = useCampaignTaskRollup(companyId, campaignId);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<
    "general" | "team" | "categories" | "danger"
  >("general");
  const [newProjectOpen, setNewProjectOpen] = React.useState(false);
  const [editProjectTarget, setEditProjectTarget] =
    React.useState<PmProjectWithRefs | null>(null);

  const campaign = campaignQuery.data;
  const campaignProjects = projectsQuery.data?.rows ?? [];
  const campaignProjectsTotal = projectsQuery.data?.total ?? 0;
  const teams = teamsQuery.data ?? [];
  const rollup = rollupQuery.data;

  // Flatten everyone currently on a team for the dashboard avatar
  // stack — deduped by company_user_id since one person can sit on
  // multiple teams and shouldn't count twice.
  const uniqueTeamMembers = React.useMemo(() => {
    const seen = new Map<string, (typeof teams)[number]["members"][number]>();
    for (const team of teams) {
      for (const m of team.members) {
        if (!seen.has(m.company_user_id)) seen.set(m.company_user_id, m);
      }
    }
    return Array.from(seen.values());
  }, [teams]);

  usePageBreadcrumb(campaign?.name);

  function openSettings(tab: typeof settingsTab = "general") {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  if (campaignQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-64 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  if (campaignQuery.error || !campaign) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Campaign not found"
          description={
            campaignQuery.error instanceof Error
              ? campaignQuery.error.message
              : "Couldn't load this campaign."
          }
        />
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link to={`${basePath}/pm/campaigns`}>
            <IconArrowLeft className="size-4" />
            Back to campaigns
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to={`${basePath}/pm/campaigns`}>
            <IconArrowLeft className="size-4" />
            Campaigns
          </Link>
        </Button>

        <PageHeader
          title={campaign.name}
          description={
            [
              campaign.campaign_code,
              campaign.category?.name,
              `Added ${formatDate(campaign.created_at)}`,
            ]
              .filter(Boolean)
              .join(" · ") || null
          }
          actions={
            <Button variant="outline" size="sm" onClick={() => openSettings("general")}>
              <IconSettings className="size-4" />
              Settings
            </Button>
          }
        />
      </div>

      <StatStrip
        projectsTotal={campaignProjectsTotal}
        colorwayTotal={campaign.colorways.length}
        teamMemberTotal={uniqueTeamMembers.length}
        openTaskTotal={
          rollup ? rollup.byStatus.open + rollup.byStatus.in_progress + rollup.byStatus.blocked : 0
        }
        totalTaskTotal={rollup?.total ?? 0}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Core information shown on the campaign list and in any downstream
              project or colorway surfaces.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 pt-0">
            {campaign.campaign_image_url ? (
              <img
                src={campaign.campaign_image_url}
                alt={campaign.name}
                className="aspect-[3/1] w-full rounded-md object-cover"
              />
            ) : null}
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Name" value={campaign.name} />
              <DetailField label="Code" value={campaign.campaign_code} mono />
              <DetailField
                label="Category"
                value={
                  campaign.category ? (
                    <Badge variant="secondary">{campaign.category.name}</Badge>
                  ) : null
                }
              />
              <DetailField
                label="Window"
                value={
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <IconCalendar className="size-3.5 text-muted-foreground" />
                    {formatDate(campaign.start_date)} →{" "}
                    {formatDate(campaign.end_date)}
                  </span>
                }
              />
              {campaign.description ? (
                <div className="sm:col-span-2">
                  <DetailField
                    label="Description"
                    value={
                      <p className="text-sm leading-relaxed text-foreground">
                        {campaign.description}
                      </p>
                    }
                  />
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPalette className="size-4 text-muted-foreground" />
              Colorways
            </CardTitle>
            <CardDescription>
              {campaign.colorways.length} total
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {campaign.colorways.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                No colorways yet.
              </p>
            ) : (
              campaign.colorways.map((cw, idx) => (
                <React.Fragment key={cw.id}>
                  {idx > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-3 py-1.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {cw.name}
                      </div>
                      {cw.colorway_code ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {cw.colorway_code}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </React.Fragment>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team — rolls up every team + member on the campaign so the
            dashboard shows "who's on this" at a glance. */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="size-4 text-muted-foreground" />
              Team
            </CardTitle>
            <CardDescription>
              {teams.length} team{teams.length === 1 ? "" : "s"} ·{" "}
              {uniqueTeamMembers.length} member
              {uniqueTeamMembers.length === 1 ? "" : "s"}
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openSettings("team")}
              >
                Manage
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {teamsQuery.isLoading ? (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Loading…
              </p>
            ) : teams.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No teams yet.</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => openSettings("team")}
                >
                  <IconPlus className="size-3.5" />
                  Add team
                </Button>
              </div>
            ) : (
              teams.map((team, idx) => (
                <React.Fragment key={team.id}>
                  {idx > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-2 py-1">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {team.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {team.members.length} member
                        {team.members.length === 1 ? "" : "s"}
                      </div>
                    </div>
                    {team.members.length > 0 ? (
                      <PmAvatarStack users={team.members} max={3} size="sm" />
                    ) : null}
                  </div>
                </React.Fragment>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tasks rollup — status buckets across every task on every
            project linked to this campaign. */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChecklist className="size-4 text-muted-foreground" />
              Tasks
            </CardTitle>
            <CardDescription>
              {rollup ? `${rollup.total} total across this campaign` : "Loading…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 pt-0">
            <TaskBucket label="Open" value={rollup?.byStatus.open ?? 0} />
            <TaskBucket
              label="In progress"
              value={rollup?.byStatus.in_progress ?? 0}
            />
            <TaskBucket label="Blocked" value={rollup?.byStatus.blocked ?? 0} />
            <TaskBucket label="Done" value={rollup?.byStatus.done ?? 0} />
          </CardContent>
        </Card>

        {/* Projects — campaign-scoped. New projects auto-link via
            lockedCampaignId. */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFolder className="size-4 text-muted-foreground" />
              Projects
            </CardTitle>
            <CardDescription>
              {campaignProjectsTotal > 0
                ? `${campaignProjectsTotal} linked to this campaign`
                : "Projects linked to this campaign"}
            </CardDescription>
            <CardAction>
              <Button size="sm" onClick={() => setNewProjectOpen(true)}>
                <IconPlus className="size-4" />
                New
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {projectsQuery.isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Loading projects…
              </p>
            ) : campaignProjects.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No projects yet — create one to track work inside this campaign.
              </p>
            ) : (
              campaignProjects.map((p, idx) => (
                <React.Fragment key={p.id}>
                  {idx > 0 ? <Separator /> : null}
                  <div className="flex items-center justify-between gap-3 py-1.5">
                    <Link
                      to={`${basePath}/pm/projects/${p.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        <IconFolder className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {p.type ? <span>{p.type.name}</span> : null}
                          {p.type && p.status ? <span>·</span> : null}
                          {p.status ? <span>{p.status}</span> : null}
                        </div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setEditProjectTarget(p)}
                    >
                      <IconPencil className="size-3.5" />
                    </Button>
                  </div>
                </React.Fragment>
              ))
            )}
            {campaignProjectsTotal > campaignProjects.length ? (
              <div className="pt-2 text-center">
                <Button variant="link" size="sm" asChild>
                  <Link
                    to={`${basePath}/pm/projects`}
                    search={{ q: campaign.name, scope: "all" }}
                  >
                    View all {campaignProjectsTotal} projects
                  </Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <CampaignSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        companyId={companyId}
        companySlug={companySlug}
        campaign={campaign}
        initialTab={settingsTab}
      />

      <ProjectFormModal
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        companyId={companyId}
        companySlug={companySlug}
        lockedCampaignId={campaign.id}
      />

      <ProjectFormModal
        open={!!editProjectTarget}
        onOpenChange={(o) => !o && setEditProjectTarget(null)}
        companyId={companyId}
        companySlug={companySlug}
        project={editProjectTarget}
      />
    </div>
  );
}

function StatStrip({
  projectsTotal,
  colorwayTotal,
  teamMemberTotal,
  openTaskTotal,
  totalTaskTotal,
}: {
  projectsTotal: number;
  colorwayTotal: number;
  teamMemberTotal: number;
  openTaskTotal: number;
  totalTaskTotal: number;
}) {
  const cards = [
    {
      label: "Projects",
      value: projectsTotal.toLocaleString(),
      icon: <IconFolder className="size-4" />,
    },
    {
      label: "Colorways",
      value: colorwayTotal.toLocaleString(),
      icon: <IconPalette className="size-4" />,
    },
    {
      label: "Team",
      value: teamMemberTotal.toLocaleString(),
      icon: <IconUsers className="size-4" />,
    },
    {
      label: "Tasks",
      value: `${openTaskTotal.toLocaleString()} / ${totalTaskTotal.toLocaleString()}`,
      icon: <IconChecklist className="size-4" />,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 @xl/main:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex items-start justify-between gap-2 rounded-md border bg-card p-4 transition-colors hover:border-primary/20"
        >
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {card.label}
            </p>
            <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
              {card.value}
            </div>
          </div>
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary ring-1 ring-primary/10">
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskBucket({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={mono ? "mt-1 font-mono text-sm" : "mt-1 text-sm"}>
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
