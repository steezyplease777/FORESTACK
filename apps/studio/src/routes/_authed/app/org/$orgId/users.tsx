import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Clock, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { formatRelativeTime } from '@/lib/utils/format/formatting'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkspaceShell } from '@/features/saas/components/workspace-shell'
import {
  appendOrgUser,
  orgUsersListQuery,
  useOrgUsers,
} from '@/lib/data/organizations/hooks'
import {
  createOrgUserFn,
  type OrgRole,
} from '@/lib/data/organizations/server'

const parentApi = getRouteApi('/_authed/app/org/$orgId')

export const Route = createFileRoute(
  '/_authed/app/org/$orgId/users',
)({
  // Loader primes the shared `['orgUsers', 'list', orgId]` cache that
  // `useOrgUsers` reads from.  That means first render paints instantly
  // from SSR data and the Add-member popover (company editor) shares
  // the same cache - invites from either surface update both.
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData(orgUsersListQuery(params.orgId)),
  component: UsersPage,
})

function UsersPage() {
  const { org } = parentApi.useLoaderData()
  const { data: users = [] } = useOrgUsers(org.id)
  const [inviteOpen, setInviteOpen] = useState(false)

  const canInvite = org.role === 'OWNER' || org.role === 'ADMIN'

  return (
    <WorkspaceShell org={org} tab="users">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Organization members
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            People who can access the {org.name} workspace.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setInviteOpen(true)}
          disabled={!canInvite}
          title={
            canInvite
              ? 'Create a new org user'
              : 'Only owners and admins can invite members'
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          Invite member
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-muted">
            {users.map((u) => {
              const displayName =
                [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
              const initials = (displayName || u.email)
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase() ?? '')
                .join('')

              const isYou = u.id === org.organizationUserId
              return (
                <li
                  key={u.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-5"
                >
                  <Avatar className="h-8 w-8">
                    {u.profilePictureUrl ? (
                      <AvatarImage src={u.profilePictureUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="bg-foreground text-xs text-white">
                      {initials || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {displayName}
                      </p>
                      {isYou ? (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          You
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                    </p>
                  </div>
                  <LastLogin value={u.lastSignInAt} />
                  {u.role ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {u.role}
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <InviteOrgUserDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        orgId={org.id}
        viewerIsOwner={org.role === 'OWNER'}
      />
    </WorkspaceShell>
  )
}

/**
 * Compact "last login" chip with a clock glyph.  Renders a muted
 * "Never signed in" placeholder for members who were invited but
 * haven't completed an auth session yet.  The absolute timestamp is
 * exposed via `title` so hovering reveals the exact time for anyone
 * who needs it for auditing.
 */
function LastLogin({ value }: { value: string | null }) {
  const never = !value
  const label = never ? 'Never signed in' : formatRelativeTime(value)
  const tooltip = never
    ? 'No sign-in recorded'
    : new Date(value!).toLocaleString()

  return (
    <span
      title={tooltip}
      className={`hidden shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex ${
        never ? 'italic text-[#a8a69d]' : ''
      }`}
    >
      <Clock className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  )
}

/**
 * Modal form for creating a brand-new `app_organization_users` row.
 *
 * Owners can mint any role (including OWNER).  Plain ADMINs are
 * restricted to ADMIN / COMPANY by the server, and the role select is
 * trimmed here to match.  On success we splice the returned row
 * straight into the shared `['orgUsers']` cache so the table updates
 * without a refetch; the company editor's Add-member popover picks up
 * the same row automatically.
 */
function InviteOrgUserDialog({
  open,
  onOpenChange,
  orgId,
  viewerIsOwner,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  viewerIsOwner: boolean
}) {
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<OrgRole>('COMPANY')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setEmail('')
    setFirstName('')
    setLastName('')
    setRole('COMPANY')
    setError(null)
    setSubmitting(false)
  }

  const close = () => {
    if (submitting) return
    onOpenChange(false)
    // Defer reset until the close animation finishes so the form
    // doesn't visibly flash back to defaults mid-fade.
    setTimeout(reset, 150)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    setSubmitting(true)
    try {
      const user = await createOrgUserFn({
        data: {
          orgId,
          email: email.trim(),
          role,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        },
      })
      appendOrgUser(queryClient, orgId, user)
      toast.success('Member invited')
      onOpenChange(false)
      setTimeout(reset, 150)
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Invite failed'
      setError(text)
      toast.error(text)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
        else onOpenChange(true)
      }}
    >
      <ModalContent className="max-w-[480px] p-0" showCloseButton={false}>
        <form onSubmit={submit} className="flex flex-col gap-5 p-5">
          <div className="flex flex-col gap-1">
            <ModalTitle className="text-base font-semibold text-foreground">
              Invite a member
            </ModalTitle>
            <ModalDescription className="text-sm text-muted-foreground">
              They&apos;ll be added to the organization and can be attached to
              companies from the company editor.
            </ModalDescription>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="person@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="invite-first">First name</Label>
              <Input
                id="invite-first"
                placeholder="Optional"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="invite-last">Last name</Label>
              <Input
                id="invite-last"
                placeholder="Optional"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as OrgRole)}
              disabled={submitting}
            >
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPANY">
                  Company — portal access only
                </SelectItem>
                <SelectItem value="ADMIN">
                  Admin — can manage orgs + companies
                </SelectItem>
                {/*
                 * OWNER is only mintable by existing owners.  Plain
                 * admins would get `owner_role_requires_owner` from
                 * the RPC otherwise; trim it client-side too so the
                 * option doesn't even appear.
                 */}
                {viewerIsOwner ? (
                  <SelectItem value="OWNER">
                    Owner — full control of the org
                  </SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="mt-1 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={close}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting || email.trim().length === 0}
            >
              {submitting ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-1 h-3.5 w-3.5" />
              )}
              {submitting ? 'Creating…' : 'Invite member'}
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  )
}
