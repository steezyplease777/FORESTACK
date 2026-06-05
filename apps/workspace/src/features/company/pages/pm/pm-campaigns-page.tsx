// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconSearch,
  IconSpeakerphone,
  IconTrash,
} from "@tabler/icons-react";

import { useCompany } from "@/features/company/tenant-provider";
import { PageHeader } from "@/components/composites/page-header";
import { EmptyState } from "@/components/composites/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import {
  useCampaigns,
  useDeleteCampaign,
} from "@/lib/data/pm/campaigns/hooks";
import type { PmCampaignWithCategory } from "@/lib/data/pm/campaigns/client";
import { totalPages } from "@/lib/data/_shared/pagination";
import { CampaignFormModal } from "@/features/company/modules/pm/campaigns/campaign-form-modal";

const routeApi = getRouteApi(
  "/$companySlug/_authed/pm/campaigns/",
);

function formatRange(start: string | null, end: string | null): string {
  const s = start ? new Date(start).toLocaleDateString() : null;
  const e = end ? new Date(end).toLocaleDateString() : null;
  if (s && e) return `${s} → ${e}`;
  if (s) return `Starts ${s}`;
  if (e) return `Ends ${e}`;
  return "—";
}

export function PmCampaignsPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { q: qFromUrl, page, pageSize } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();

  // Local text state for the search input so typing feels instant;
  // debounced writes into the URL (and therefore into the query key)
  // so we don't fire a Supabase request on every keystroke.
  const [searchInput, setSearchInput] = React.useState(qFromUrl);
  React.useEffect(() => {
    // Keep local input in sync when URL changes externally (back button,
    // deep link, etc). Only applied when the values actually diverge.
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

  const campaignsQuery = useCampaigns(companyId, {
    page,
    pageSize,
    q: qFromUrl,
  });
  const deleteCampaign = useDeleteCampaign(companyId, companySlug);

  const newCampaignHref = `${basePath}/pm/campaigns/new`;
  const [editTarget, setEditTarget] =
    React.useState<PmCampaignWithCategory | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<PmCampaignWithCategory | null>(null);

  const result = campaignsQuery.data;
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pageCount = totalPages(total, pageSize);
  // `isPlaceholderData` tells us we're showing last page's rows while
  // TanStack fetches the next — used to dim the table during the tiny
  // in-flight window without a spinner.
  const isPaging = campaignsQuery.isPlaceholderData;
  const isInitialLoading = campaignsQuery.isLoading && !result;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Campaigns"
        description={
          total > 0
            ? `${total.toLocaleString()} total — create, edit, and schedule your seasonal programs.`
            : "Create, edit, and schedule your seasonal programs."
        }
        actions={
          <Button size="sm" asChild>
            <Link to={newCampaignHref}>
              <IconPlus className="size-4" />
              New campaign
            </Link>
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
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 w-56 pl-8"
              placeholder="Search name or code…"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                commitSearch(e.target.value);
              }}
            />
          </div>
        </div>

        {isInitialLoading ? (
          <TableSkeleton />
        ) : campaignsQuery.error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load campaigns
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {campaignsQuery.error instanceof Error
                ? campaignsQuery.error.message
                : "Unknown error"}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No campaigns found"
            description={
              qFromUrl
                ? "Try a different search."
                : "Create your first campaign to kick off a program."
            }
            actionLabel={!qFromUrl ? "New campaign" : undefined}
            onAction={
              !qFromUrl ? () => navigate({ to: newCampaignHref }) : undefined
            }
          />
        ) : (
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
              isPaging && "transition-opacity opacity-60",
            )}
          >
            {rows.map((c) => (
              <CampaignTile
                key={c.id}
                campaign={c}
                detailHref={`${basePath}/pm/campaigns/${c.id}`}
                onEdit={() => setEditTarget(c)}
                onDelete={() => setDeleteTarget(c)}
              />
            ))}
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

      <CampaignFormModal
        open={!!editTarget}
        onOpenChange={(o) => !o && setEditTarget(null)}
        companyId={companyId}
        companySlug={companySlug}
        campaign={editTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? "campaign"}?`}
        description="This permanently removes the campaign and all its colorways and team assignments."
        confirmText={deleteCampaign.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteCampaign.mutateAsync({ id: deleteTarget.id });
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/**
 * Gallery tile for a campaign. Campaigns are visual/seasonal so the
 * list gives each one real estate for its cover image and metadata.
 * The whole card is a single anchor into detail; the actions menu
 * stops propagation so the parent Link doesn't fire.
 */
function CampaignTile({
  campaign,
  detailHref,
  onEdit,
  onDelete,
}: {
  campaign: PmCampaignWithCategory;
  detailHref: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const src = campaign.campaign_image_url;
  return (
    <Link
      to={detailHref}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-xs transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {src ? (
          <img
            src={src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/60 text-muted-foreground">
            <IconSpeakerphone className="size-8" />
          </div>
        )}
        {campaign.campaign_code ? (
          <div className="absolute left-3 top-3 rounded-md bg-background/80 px-2 py-0.5 font-mono text-[11px] font-medium backdrop-blur">
            {campaign.campaign_code}
          </div>
        ) : null}
        <div
          className="absolute right-2 top-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <CampaignTileActions
            campaign={campaign}
            detailHref={detailHref}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 min-w-0 flex-1 font-semibold leading-snug group-hover:underline">
            {campaign.name}
          </h3>
          {campaign.category ? (
            <Badge variant="secondary" className="shrink-0">
              {campaign.category.name}
            </Badge>
          ) : null}
        </div>
        {campaign.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {campaign.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconCalendar className="size-3.5" />
          {formatRange(campaign.start_date, campaign.end_date)}
        </div>
      </div>
    </Link>
  );
}

function CampaignTileActions({
  campaign,
  detailHref,
  onEdit,
  onDelete,
}: {
  campaign: PmCampaignWithCategory;
  detailHref: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="size-8 bg-background/80 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
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
          disabled={!campaign.id}
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-lg border bg-card"
        >
          <div className="aspect-[16/9] w-full animate-pulse bg-muted" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
