// @ts-nocheck
import * as React from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconExternalLink,
  IconPencil,
  IconPlus,
  IconSearch,
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
import { toast } from "sonner";

import {
  useDeletePlmSourcing,
  usePlmSourcing,
} from "@/lib/data/plm/sourcing/hooks";
import type { SourcingWithRefs } from "@/lib/data/plm/sourcing/client";
import { totalPages } from "@/lib/data/_shared/pagination";

const routeApi = getRouteApi(
  "/$companySlug/_authed/plm/sourcing/",
);

export function PlmSourcingPage() {
  const { company, companySlug } = useCompany();
  const companyId = company?.companyId ?? "";
  const basePath = `/${companySlug}`;

  const { q: qFromUrl, page, pageSize } = routeApi.useSearch();
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

  const sourcingQuery = usePlmSourcing(companyId, {
    page,
    pageSize,
    q: qFromUrl,
  });
  const deleteSourcing = useDeletePlmSourcing(companyId, companySlug);

  const newSourcingHref = `${basePath}/plm/sourcing/new`;
  const [deleteTarget, setDeleteTarget] =
    React.useState<SourcingWithRefs | null>(null);

  const result = sourcingQuery.data;
  const rows = result?.rows ?? [];
  const total = result?.total ?? 0;
  const pageCount = totalPages(total, pageSize);
  const isPaging = sourcingQuery.isPlaceholderData;
  const isInitialLoading = sourcingQuery.isLoading && !result;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-6">
      <PageHeader
        title="Sourcing"
        description={
          total > 0
            ? `${total.toLocaleString()} total — vendor, cost, and tariff data per style.`
            : "Vendor, cost, and tariff data per style."
        }
        actions={
          <Button size="sm" asChild>
            <Link to={newSourcingHref}>
              <IconPlus className="size-4" />
              New sourcing
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {rows.length > 0 ? (
              <>
                Showing{" "}
                <span className="tabular-nums">
                  {(page - 1) * pageSize + 1}–
                  {(page - 1) * pageSize + rows.length}
                </span>{" "}
                of <span className="tabular-nums">{total.toLocaleString()}</span>
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
              placeholder="Search HS code…"
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
        ) : sourcingQuery.error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Couldn't load sourcing
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {sourcingQuery.error instanceof Error
                ? sourcingQuery.error.message
                : "Unknown error"}
            </p>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No sourcing yet"
            description={
              qFromUrl
                ? "Try a different search."
                : "Add a sourcing record to start tracking cost and tariff data."
            }
            actionLabel={!qFromUrl ? "New sourcing" : undefined}
            onAction={
              !qFromUrl ? () => navigate({ to: newSourcingHref }) : undefined
            }
          />
        ) : (
          <div
            className={cn(
              "overflow-hidden rounded-md border",
              isPaging ? "opacity-60 transition-opacity" : undefined,
            )}
          >
            <Table className="table-fixed">
              <TableHeader>
                {/* Ops-first layout: Vendor is the primary header (who
                    we source from), COG is the dominant numeric column,
                    Style is demoted to a mono secondary, and HS
                    tariff / weight sit to the right. */}
                <TableRow>
                  <TableHead className="w-[30%]">Vendor</TableHead>
                  <TableHead className="w-[26%]">Style</TableHead>
                  <TableHead className="w-[14%] bg-muted/30 text-right">
                    COG
                  </TableHead>
                  <TableHead className="w-[14%]">HS tariff</TableHead>
                  <TableHead className="w-[12%] text-right">Weight</TableHead>
                  <TableHead className="w-[4%] sr-only">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.id} className="group h-14">
                    <TableCell>
                      <Link
                        to={`${basePath}/plm/sourcing/${s.id}`}
                        className="block min-w-0"
                      >
                        <div className="truncate text-sm font-semibold group-hover:underline">
                          {s.vendor?.name ?? (
                            <span className="font-normal text-muted-foreground">
                              No vendor
                            </span>
                          )}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          Added{" "}
                          {s.created_at
                            ? new Date(s.created_at).toLocaleDateString()
                            : "—"}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {s.style ? (
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-mono text-xs">
                            {s.style.style_number}
                          </span>
                          {s.style.style_name ? (
                            <span className="truncate text-[11px] text-muted-foreground">
                              {s.style.style_name}
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          — missing style —
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="bg-muted/20 text-right">
                      {s.cog != null ? (
                        <span className="text-sm font-semibold tabular-nums">
                          ${Number(s.cog).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.hs_tariff_code ? (
                        <Badge
                          variant="outline"
                          className="h-5 px-1.5 font-mono text-[10px]"
                        >
                          {s.hs_tariff_code}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                      {s.weight != null ? Number(s.weight) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <SourcingRowActions
                        row={s}
                        detailHref={`${basePath}/plm/sourcing/${s.id}`}
                        onDelete={() => setDeleteTarget(s)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete sourcing record?"
        description={
          <span>
            Removes this sourcing row for{" "}
            <span className="font-mono">
              {deleteTarget?.style?.style_number ?? "—"}
            </span>
            . Products still linked to it will block deletion — unlink those
            first.
          </span>
        }
        confirmText={deleteSourcing.isPending ? "Deleting…" : "Delete"}
        tone="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteSourcing.mutateAsync({ id: deleteTarget.id });
            setDeleteTarget(null);
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Delete failed",
            );
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function SourcingRowActions({
  row,
  detailHref,
  onDelete,
}: {
  row: SourcingWithRefs;
  detailHref: string;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Actions"
          className="size-7 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
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
        <DropdownMenuItem asChild>
          <Link to={`${detailHref}?edit=1`} className="flex items-center gap-2">
            <IconPencil className="size-4" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} variant="destructive">
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
