import { Link, createFileRoute, getRouteApi } from '@tanstack/react-router'
import { Building2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceShell } from '@/features/saas/components/workspace-shell'

const parentApi = getRouteApi('/_authed/app/org/$orgId')

export const Route = createFileRoute(
  '/_authed/app/org/$orgId/dashboard',
)({
  component: DashboardPage,
})

function DashboardPage() {
  const { org } = parentApi.useLoaderData()
  const friendlyName = org.firstName?.trim() || org.email.split('@')[0]

  return (
    <WorkspaceShell org={org} tab="dashboard">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome{friendlyName ? `, ${friendlyName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s in <span className="font-medium">{org.name}</span>
          {' '}right now.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Building2 className="h-4 w-4" />}
          label="Companies"
          count={org.companyCount}
          action={{
            label: org.companyCount === 0 ? 'Add your first company' : 'Manage companies',
            to: '/app/org/$orgId/companies',
            params: { orgId: org.id },
          }}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Organization members"
          count={org.userCount}
          action={{
            label: 'View members',
            to: '/app/org/$orgId/users',
            params: { orgId: org.id },
          }}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Workspace details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <DetailRow label="Name" value={org.name} />
          <DetailRow
            label="Your role"
            value={org.role ?? '—'}
            valueClassName="uppercase tracking-wide text-xs"
          />
          <DetailRow
            label="Created"
            value={new Date(org.createdAt).toLocaleDateString()}
          />
        </CardContent>
      </Card>
    </WorkspaceShell>
  )
}

function StatCard({
  icon,
  label,
  count,
  action,
}: {
  icon: React.ReactNode
  label: string
  count: number
  action: { label: string; to: string; params: Record<string, string> }
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="text-3xl font-semibold text-foreground">{count}</div>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-fit"
        >
          <Link to={action.to as any} params={action.params as any}>
            {action.label}
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between border-b border-muted py-2 last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={valueClassName ?? ''}>{value}</span>
    </div>
  )
}
