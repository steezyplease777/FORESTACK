import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  createFileRoute,
  getRouteApi,
  useRouter,
} from '@tanstack/react-router'
import { Pencil, Settings } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WorkspaceShell } from '@/features/saas/components/workspace-shell'
import { WorkspaceEditDialog } from '@/features/saas/components/workspace-edit-dialog'
import type { MyOrganizationDetail } from '@/lib/data/organizations/server'

const parentApi = getRouteApi('/_authed/app/org/$orgId')

// Kept in sync with the cache key in
// `routes/_authed/app/org/$orgId/route.tsx` so successful
// edits can write straight into the loader's warm cache entry.
const orgQueryKey = (orgId: string) => ['myOrganization', orgId] as const

export const Route = createFileRoute(
  '/_authed/app/org/$orgId/settings',
)({
  component: SettingsPage,
})

function SettingsPage() {
  const { org } = parentApi.useLoaderData()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)

  const canEdit = org.role === 'OWNER'

  const handleSaved = async (fresh: MyOrganizationDetail) => {
    // Seed the query cache with the fresh detail so the parent route's
    // `ensureQueryData` returns it immediately on the re-run below.
    queryClient.setQueryData(orgQueryKey(org.id), fresh)
    // `invalidate()` re-runs `beforeLoad`, which re-reads the query and
    // repopulates route context -> every sibling tab (dashboard, users,
    // companies) sees the new name/logo on next navigation without a
    // separate refetch path.
    await router.invalidate()
  }

  return (
    <WorkspaceShell org={org} tab="settings">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <Settings className="h-6 w-6 text-muted-foreground" />
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage workspace identity and access for{' '}
            <span className="font-medium">{org.name}</span>.
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">General</CardTitle>
            {canEdit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-md">
                {org.logoUrl ? (
                  <AvatarImage src={org.logoUrl} alt={org.name} />
                ) : null}
                <AvatarFallback className="rounded-md bg-foreground text-sm text-white">
                  {org.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {org.name}
                </p>
              </div>
            </div>

            <dl className="grid gap-2 text-sm">
              <Row label="Name" value={org.name} />
              <Row
                label="Your role"
                value={
                  <span className="uppercase tracking-wide text-xs">
                    {org.role ?? '—'}
                  </span>
                }
              />
              <Row
                label="Created"
                value={new Date(org.createdAt).toLocaleDateString()}
              />
            </dl>

            {!canEdit ? (
              <p className="text-xs text-muted-foreground">
                Only the workspace owner can edit these settings.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {canEdit ? (
        <WorkspaceEditDialog
          org={org}
          open={editOpen}
          onOpenChange={setEditOpen}
          onSaved={handleSaved}
        />
      ) : null}
    </WorkspaceShell>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-muted py-2 last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
