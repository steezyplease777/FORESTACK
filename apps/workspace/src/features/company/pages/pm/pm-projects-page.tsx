// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  IconCalendar,
  IconChecklist,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconExternalLink,
  IconFolder,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUsers,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  useDeleteProject,
  useProjects,
} from "@/lib/data/pm/projects/hooks";
import type { PmProjectWithRefs } from "@/lib/data/pm/projects/client";
import { totalPages } from "@/lib/data/_shared/pagination";
import { ProjectFormModal } from "@/features/company/modules/pm/projects/project-form-modal";

const routeApi = getRouteApi(
  "/$companySlug/_authed/pm/projects/",
);

function formatRange(start: string | null, end: string | null): string {
  const s = start ? new Date(start).toLocaleDateString() : null;
  const e = end ? new Date(end).toLocaleDateString() : null;
  if (s && e) return `${s} → ${e}`;
  if (s) return `Starts ${s}`;
  if (e) return `Ends ${e}`;
  return "—";
}

/**
 * Standalone Projects tab.
 *
 * The Projects tab is intentionally scoped to `standalone` (i.e.
 * `campaign_id IS NULL`). Campaign-linked projects live on their
 * campaign detail page's Projects card so the two flows stay visually
 * distinct. A user who wants "every project across the company" can
 * flip the scope selector at the top of the card to `All projects`,
 * which just swaps the scope key used by the paginated query — no
 * extra endpoint, no client-side filter.
 */
export function PmProjectsPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { q: qFromUrl, page, pageSize, scope } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  const [searchInput, setSearchInput] = React.useState(qFromUrl);
  React.useEffect(() => {
    setSearchInput((prev) => (prev === qFromUrl ? prev : qFromUrl));
  }, [qFromUrl]);

  const commitSearch = useDebouncedCallback(
    (next: string) => {
      navigate({
        search: (prev) => ({ ...prev, q: next, page: 1 }),
        replace: true,
      });
    },
    { wait: 250 },
  );

  const setPage = (next: number) =>
    navigate({ search: (prev) => ({ ...prev, page: next }) });

  const setScope = (next: "standalone" | "all") =>
    navigate({
      search: (prev) => ({ ...prev, scope: next, page: 1 }),
      replace: true,
    });

  const projectsQuery = useProjects(companyId, {
    scope: scope === "all" ? "all" : "standalone",
    page,
    pageSize,
    q: qFromUrl,
  });
  const deleteProject = useDeleteProject(companyId, companySlug);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] =
    React.useState<PmProjectWithRefs | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<PmProjectWithRefs | null>(null);

  const result = projectsQuery.data;
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pageCount = totalPages(total, pageSize);
  const isPaging = projectsQuery.isPlaceholderData;
  const isInitialLoading = projectsQuery.isLoading && !result;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Projects"
        description={
          total > 0
            ? `${total.toLocaleString()} ${scope === "all" ? "total" : "standalone"} — track work across your programs.`
            : "Create standalone projects or link them to campaigns."
        }
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="size-4" />
            New project
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {rows.length > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {(page - 1) * pageSize + 1}–
                  {(page - 1) * pageSize + rows.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {total.toLocaleString()}
                </span>
                {qFromUrl ? ` · filtered by "${qFromUrl}"` : ""}
              </>
            ) : (
              "No results"
            )}
          </p>
          <div className="flex items-center gap-2">
            {/* Scope pill — standalone-only (default) vs all. */}
            <div
              className="inline-flex rounded-md border bg-muted/30 p-0.5"
              role="tablist"
              aria-label="Project scope"
            >
              <button
                type="button"
                role="tab"
                aria-selected={scope !== "all"}
                onClick={() => setScope("standalone")}
                className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  scope !== "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Standalone
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={scope === "all"}
                onClick={() => setScope("all")}
                className={`rounded-sm px-2.5 py-1 text-xs font-medium transition-colors ${
                  scope === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
            </div>

            <div className="relative">
              <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-8 w-56 pl-8"
                placeholder="Search name or description…"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  commitSearch(e.target.value);
                }}
              />
            </div>
          </div>
        </div>

        {isInitialLoading ? (
          <TableSkeleton />
        ) : projectsQuery.error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load projects
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {projectsQuery.error instanceof Error
                ? projectsQuery.error.message
                : "Unknown error"}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={
              qFromUrl
                ? "No projects found"
                : scope === "all"
                  ? "No projects yet"
                  : "No standalone projects yet"
            }
            description={
              qFromUrl
                ? "Try a different search."
                : scope === "all"
                  ? "Create a project or open a campaign to add one there."
                  : "Create a standalone project or open a campaign to add a campaign-linked one."
            }
            actionLabel={!qFromUrl ? "New project" : undefined}
            onAction={!qFromUrl ? () => setCreateOpen(true) : undefined}
          />
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-md border",
              isPaging && "transition-opacity opacity-60",
            )}
          >
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[38%]">Project</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[22%]">Progress</TableHead>
                  <TableHead className="w-[20%]">Window</TableHead>
                  <TableHead className="w-[6%]">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => {
                  const tasks = p.tasks ?? [];
                  const total = tasks.length;
                  const done = tasks.filter((t) => t.status === "done").length;
                  const blocked = tasks.filter(
                    (t) => t.status === "blocked",
                  ).length;
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                  return (
                    <TableRow key={p.id} className="group h-16">
                      <TableCell>
                        <Link
                          to={`${basePath}/pm/projects/${p.id}`}
                          className="flex items-center gap-3"
                        >
                          <ProjectThumb />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium hover:underline">
                              {p.name}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              {p.type ? (
                                <span className="truncate">{p.type.name}</span>
                              ) : null}
                              {p.type && (p.campaign || p.member_count) ? (
                                <span aria-hidden>·</span>
                              ) : null}
                              {p.campaign ? (
                                <span className="truncate">
                                  {p.campaign.name}
                                </span>
                              ) : (
                                <span className="italic">Standalone</span>
                              )}
                              {typeof p.member_count === "number" &&
                              p.member_count > 0 ? (
                                <>
                                  <span aria-hidden>·</span>
                                  <span className="inline-flex items-center gap-1">
                                    <IconUsers className="size-3" />
                                    {p.member_count}
                                  </span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={p.status} />
                      </TableCell>
                      <TableCell>
                        <ProgressCell
                          done={done}
                          total={total}
                          blocked={blocked}
                          pct={pct}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <IconCalendar className="size-3.5" />
                          {formatRange(p.start_date, p.end_date)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ProjectRowActions
                          project={p}
                          onEdit={() => setEditTarget(p)}
                          onDelete={() => setDeleteTarget(p)}
                          detailHref={`${basePath}/pm/projects/${p.id}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground tabular-nums">
              Page {page} of {pageCount} · {pageSize} per page
            </p>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPaging}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                <IconChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount || isPaging}
                onClick={() => setPage(Math.min(pageCount, page + 1))}
              >
                Next
                <IconChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      <ProjectFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        companyId={companyId}
        companySlug={companySlug}
      />

      <ProjectFormModal
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        companyId={companyId}
        companySlug={companySlug}
        project={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "project"}?`}
        description="This permanently removes the project and any tasks attached to it."
        confirmText={deleteProject.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteProject.mutateAsync({
            id: deleteTarget.id,
            campaign_id: deleteTarget.campaign_id,
          });
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ProjectThumb() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <IconFolder className="size-4" />
    </div>
  );
}

/**
 * Pill that colorizes common project statuses so the status column
 * reads at a glance. Unknown statuses fall back to a neutral outline
 * so we don't break when the schema grows new values.
 */
function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  const tone = statusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        tone,
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", dotTone(status))}
        aria-hidden
      />
      {status.replace(/_/g, " ")}
    </span>
  );
}

function statusTone(status: string): string {
  switch (status.toLowerCase()) {
    case "done":
    case "complete":
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "blocked":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "in_progress":
    case "in progress":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "on_hold":
    case "on hold":
    case "paused":
      return "border-slate-200 bg-slate-50 text-slate-700";
    case "planning":
      return "border-sky-200 bg-sky-50 text-sky-800";
    default:
      return "border-border bg-muted/40 text-foreground";
  }
}

function dotTone(status: string): string {
  switch (status.toLowerCase()) {
    case "done":
    case "complete":
    case "completed":
      return "bg-emerald-500";
    case "blocked":
      return "bg-rose-500";
    case "in_progress":
    case "in progress":
      return "bg-amber-500";
    case "on_hold":
    case "on hold":
    case "paused":
      return "bg-slate-400";
    case "planning":
      return "bg-sky-500";
    default:
      return "bg-muted-foreground/40";
  }
}

/**
 * Inline progress bar + "done / total" count. Renders an empty-state
 * dash when there are no tasks so rows don't lie about completion.
 */
function ProgressCell({
  done,
  total,
  blocked,
  pct,
}: {
  done: number;
  total: number;
  blocked: number;
  pct: number;
}) {
  if (total === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconChecklist className="size-3.5" />
        No tasks
      </span>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1 tabular-nums text-foreground">
          <IconChecklist className="size-3.5 text-muted-foreground" />
          {done}/{total}
        </span>
        <span className="tabular-nums text-muted-foreground">{pct}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-[width]",
            blocked > 0
              ? "bg-gradient-to-r from-emerald-500 to-rose-400"
              : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ProjectRowActions({
  project,
  onEdit,
  onDelete,
  detailHref,
}: {
  project: PmProjectWithRefs;
  onEdit: () => void;
  onDelete: () => void;
  detailHref: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 opacity-60 transition-opacity group-hover:opacity-100"
          aria-label="Actions"
        >
          <IconDotsVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={detailHref} className="flex items-center gap-2">
            <IconExternalLink className="size-4" />
            Open detail
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <IconPencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={onDelete}
          disabled={!project.id}
        >
          <IconTrash className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-md border bg-muted/40 p-3"
        >
          <div className="size-10 animate-pulse rounded bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
