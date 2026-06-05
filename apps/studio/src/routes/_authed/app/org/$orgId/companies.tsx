import { useMemo, useState } from 'react'
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Building2, ExternalLink, MoreHorizontal, Plus, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CompanyEditDialog } from '@/features/saas/components/company-edit-dialog'
import { WorkspaceShell } from '@/features/saas/components/workspace-shell'
import { createOrgCompanyFn } from '@/lib/data/organizations/server'
import type { CompanyEditSnapshot } from '@/lib/data/company-editor/server'
import {
  applyCompanySnapshot,
  orgCompaniesKeys,
  orgCompaniesListQuery,
  seedCompanyDetailCaches,
  useOrgCompanies,
} from '@/lib/data/organizations/hooks'

const parentApi = getRouteApi('/_authed/app/org/$orgId')

/**
 * Edit-target is carried as a search param (`?edit=<companyId>`) for
 * deep-linkability and so the browser back button closes the modal.
 *
 * Crucially we DO NOT re-fetch anything when `edit` changes: the
 * companies list endpoint already returned a full `CompanyEditSnapshot`
 * per company and the route loader seeded each of them into the
 * `orgCompaniesKeys.detail(id)` cache.  The modal reads that cache via
 * `useCompanySnapshot` and therefore opens fully hydrated on the same
 * tick as the click.  See `src/lib/data/organizations/hooks.ts`.
 */
type CompaniesSearch = { edit?: string }

export const Route = createFileRoute(
  '/_authed/app/org/$orgId/companies',
)({
  validateSearch: (search: Record<string, unknown>): CompaniesSearch => ({
    edit: typeof search.edit === 'string' && search.edit.length > 0
      ? search.edit
      : undefined,
  }),
  loader: async ({ params, context }) => {
    // One round trip, one query key.  The handler returns snapshots so
    // the seed below is what makes "click edit = instant modal" work.
    const list = await context.queryClient.ensureQueryData(
      orgCompaniesListQuery(params.orgId),
    )
    seedCompanyDetailCaches(context.queryClient, list)
    return null
  },
  component: CompaniesPage,
})

/**
 * Mirror of the Postgres `create_org_company` slug derivation so the user
 * can see a preview before the row is persisted. Keep in sync with
 * `public.create_org_company` in `supabase/migrations`.
 */
function previewSlug(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'company'
}

function CompaniesPage() {
  const { org } = parentApi.useLoaderData()
  const { edit: editingCompanyId } = Route.useSearch()
  const router = useRouter()
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: Route.fullPath })

  // Loader already primed this query; first render is synchronous data.
  const { data: companies = [] } = useOrgCompanies(org.id)

  const canCreate = org.role === 'OWNER' || org.role === 'ADMIN'

  const [isCreating, setIsCreating] = useState(false)

  const setEditingCompany = (id: string | null) => {
    // Opening PUSHES so the browser back button closes the modal - the
    // natural mental model when someone lands via deep-link too.
    // Closing REPLACES so repeatedly opening/closing doesn't accumulate
    // history entries the user has to back-button through.
    void navigate({
      search: (prev) => ({ ...prev, edit: id ?? undefined }),
      replace: id === null,
    })
  }

  /**
   * Called by the modal after every successful mutation with the fresh
   * `CompanyEditSnapshot` the server returned in the same HTTP round
   * trip as the write.  We write it directly into the detail cache and
   * the matching entry of the list cache - no refetch, no loading
   * flicker, one network request per mutation end-to-end.
   */
  const handleCompanyMutated = (snap: CompanyEditSnapshot) => {
    applyCompanySnapshot(queryClient, snap)
  }

  return (
    <WorkspaceShell org={org} tab="companies">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Companies live under {org.name} and each gets their own tenant
            portal.
          </p>
        </div>
        {canCreate ? (
          <Button
            size="sm"
            onClick={() => setIsCreating((v) => !v)}
            variant={isCreating ? 'outline' : 'default'}
          >
            {isCreating ? (
              <>
                <X className="mr-1 h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                New company
              </>
            )}
          </Button>
        ) : (
          <Button size="sm" disabled title="Only owners and admins can add companies">
            <Plus className="mr-1 h-4 w-4" />
            New company
          </Button>
        )}
      </div>

      {isCreating ? (
        <div className="mb-4">
          <CreateCompanyForm
            orgId={org.id}
            onCancel={() => setIsCreating(false)}
            onCreated={async () => {
              setIsCreating(false)
              await queryClient.invalidateQueries({
                queryKey: orgCompaniesKeys.all,
              })
              // `router.invalidate()` is redundant here - the list query
              // rerun above refreshes the page data.  Keeping the router
              // call out on purpose; no need to rerun unrelated loaders.
              await router.invalidate()
            }}
          />
        </div>
      ) : null}

      {companies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              No companies yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Companies are tenants with their own sub-domain and team. Add
              one to unlock the tenant portal.
            </p>
          </div>
        </div>
      ) : (
        /*
         * Lightweight list inset: white card with thin border, one row
         * per company. Sized so a single-entry list reads as a clean
         * card rather than floating in a sea of cream — borderless rows
         * with hover affordance keep things readable as the list grows.
         */
        <div className="overflow-hidden rounded-lg border bg-card">
          <ul className="divide-y divide-border">
            {companies.map(({ company: c }) => (
              <li
                key={c.id}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 md:px-5"
              >
                <Avatar className="h-9 w-9 shrink-0 rounded-md">
                  {c.logoUrl ? (
                    <AvatarImage src={c.logoUrl} alt={c.name} />
                  ) : null}
                  <AvatarFallback className="rounded-md bg-foreground text-xs text-white">
                    {c.name.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {c.name}
                  </p>
                  {c.slug ? (
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {c.slug}
                    </p>
                  ) : null}
                </div>
                <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                  Added {new Date(c.createdAt).toLocaleDateString()}
                </span>

                {/*
                 * Plain anchor + `target="_blank"` instead of a
                 * `<Link>` because the company portal is a distinct
                 * auth context (magic-link only). Opening in a new
                 * tab keeps the SaaS session here intact, and the
                 * `/$companySlug` root redirects into `dashboard`
                 * (or to login/access-denied if the admin isn't a
                 * company member — the expected path for most SaaS
                 * owners who don't also sit inside the tenant).
                 */}
                {c.slug ? (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <a
                      href={`/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${c.name} company portal`}
                    >
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      Open portal
                    </a>
                  </Button>
                ) : null}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Open ${c.name} actions`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditingCompany(c.id)}>
                      Edit company
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CompanyEditDialog
        companyId={editingCompanyId ?? null}
        open={Boolean(editingCompanyId)}
        onOpenChange={(next) => {
          if (!next) setEditingCompany(null)
        }}
        onMutated={handleCompanyMutated}
      />
    </WorkspaceShell>
  )
}

function CreateCompanyForm({
  orgId,
  onCancel,
  onCreated,
}: {
  orgId: string
  onCancel: () => void
  onCreated: () => void | Promise<void>
}) {
  const [name, setName] = useState('')
  const [slugOverride, setSlugOverride] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Preview mirrors the server slug algorithm. When the user types in the
  // slug field that wins over the name-derived one.
  const previewedSlug = useMemo(
    () => previewSlug(slugOverride || name),
    [name, slugOverride],
  )

  const canSubmit = name.trim().length >= 2 && !isSubmitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setIsSubmitting(true)
    try {
      await createOrgCompanyFn({
        data: {
          orgId,
          name: name.trim(),
          slug: slugOverride.trim() || undefined,
        },
      })
      await onCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Add a company
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                required
                placeholder="Acme Manufacturing"
                autoComplete="organization"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-slug">
                URL handle <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="company-slug"
                placeholder={previewSlug(name) || 'acme'}
                value={slugOverride}
                onChange={(e) => setSlugOverride(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The company will live at{' '}
            <span className="font-mono text-foreground">
              {previewedSlug}.yourdomain
            </span>
            . We&apos;ll append a number if that handle is already in use.
          </p>

          {error ? (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canSubmit}>
              {isSubmitting ? 'Creating…' : 'Create company'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
