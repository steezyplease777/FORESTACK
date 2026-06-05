// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconCalendar,
  IconPencil,
  IconSpeakerphone,
  IconTrash,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  useDeleteProject,
  useProject,
} from "@/lib/data/pm/projects/hooks";
import { ProjectFormModal } from "@/features/company/modules/pm/projects/project-form-modal";
import { ProjectMembersCard } from "@/features/company/modules/pm/projects/project-members-card";
import { ProjectTasksSection } from "@/features/company/modules/pm/projects/project-tasks-section";
import { usePageBreadcrumb } from "@/features/company/components/header/page-breadcrumb-context";

const routeApi = getRouteApi(
  "/$companySlug/_authed/pm/projects/$projectId",
);

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function PmProjectDetailPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { projectId } = routeApi.useParams();
  const navigate = useNavigate();

  const projectQuery = useProject(companyId, projectId);
  const deleteProject = useDeleteProject(companyId, companySlug);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const project = projectQuery.data;

  // Register the project name for the global breadcrumb; this
  // produces "Projects › Projects › <name>" (module › nav item ›
  // entity). Safe to call unconditionally — no-op while loading.
  usePageBreadcrumb(project?.name);

  if (projectQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-64 animate-pulse rounded-lg bg-muted/50" />
      </div>
    );
  }

  if (projectQuery.error || !project) {
    return (
      <div className="flex flex-col gap-6 p-4 lg:p-6">
        <PageHeader
          title="Project not found"
          description={
            projectQuery.error instanceof Error
              ? projectQuery.error.message
              : "Couldn't load this project."
          }
        />
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link to={`${basePath}/pm/projects`}>
            <IconArrowLeft className="size-4" />
            Back to projects
          </Link>
        </Button>
      </div>
    );
  }

  // The "back" link defaults to the Projects tab, but if the project
  // is campaign-scoped we point it back to its campaign so drilling
  // in from a campaign detail page round-trips cleanly.
  const backHref = project.campaign
    ? `${basePath}/pm/campaigns/${project.campaign.id}`
    : `${basePath}/pm/projects`;
  const backLabel = project.campaign ? project.campaign.name : "Projects";

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
          <Link to={backHref}>
            <IconArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </Button>

        <PageHeader
          title={project.name}
          description={
            [
              project.type?.name,
              project.status,
              `Added ${formatDate(project.created_at)}`,
            ]
              .filter(Boolean)
              .join(" · ") || null
          }
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <IconPencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <IconTrash className="size-4" />
                Delete
              </Button>
            </>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Core information for this project and its campaign link.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailField label="Name" value={project.name} />
              <DetailField
                label="Type"
                value={
                  project.type ? (
                    <Badge variant="secondary">{project.type.name}</Badge>
                  ) : null
                }
              />
              <DetailField
                label="Campaign"
                value={
                  project.campaign ? (
                    <Link
                      to={`${basePath}/pm/campaigns/${project.campaign.id}`}
                      className="inline-flex items-center gap-1.5 text-sm hover:underline"
                    >
                      <IconSpeakerphone className="size-3.5 text-muted-foreground" />
                      {project.campaign.name}
                    </Link>
                  ) : (
                    <Badge variant="outline">Standalone</Badge>
                  )
                }
              />
              <DetailField
                label="Status"
                value={
                  project.status ? (
                    <Badge variant="outline">{project.status}</Badge>
                  ) : null
                }
              />
              <DetailField
                label="Window"
                value={
                  <span className="inline-flex items-center gap-1.5 text-sm">
                    <IconCalendar className="size-3.5 text-muted-foreground" />
                    {formatDate(project.start_date)} →{" "}
                    {formatDate(project.end_date)}
                  </span>
                }
              />
              <DetailField
                label="Added"
                value={formatDate(project.created_at)}
              />
              {project.description ? (
                <div className="sm:col-span-2">
                  <DetailField
                    label="Description"
                    value={
                      <p className="text-sm leading-relaxed text-foreground">
                        {project.description}
                      </p>
                    }
                  />
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>

        <ProjectMembersCard projectId={project.id} companyId={companyId} />
      </div>

      <ProjectTasksSection
        projectId={project.id}
        companyId={companyId}
        companySlug={companySlug}
      />

      <ProjectFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        companyId={companyId}
        companySlug={companySlug}
        project={project}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${project.name}?`}
        description="This permanently removes the project and any tasks attached to it."
        confirmText={deleteProject.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          await deleteProject.mutateAsync({
            id: project.id,
            campaign_id: project.campaign_id,
          });
          setDeleteOpen(false);
          navigate({ to: backHref });
        }}
        onCancel={() => setDeleteOpen(false)}
      />
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
