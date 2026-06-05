import { Link, useNavigate } from '@tanstack/react-router'
import { Building2, ChevronDown, LogOut, Settings } from 'lucide-react'

import { SAAS_TABS, type WorkspaceTab } from '@/config/saas.registry'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { signOutFn } from '@/lib/data/auth/server'
import { cn } from '@/lib/utils/format/formatting'
import type { MyOrganizationDetail } from '@/lib/data/organizations/server'

function WorkspaceShell({
  org,
  tab,
  children,
}: {
  org: MyOrganizationDetail
  tab: WorkspaceTab
  children: React.ReactNode
}) {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOutFn()
    navigate({ to: '/login' })
  }

  const displayName =
    [org.firstName, org.lastName].filter(Boolean).join(' ') || org.email
  const initials = (displayName || org.email || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/*
       * Three-column layout: brand+switcher on the left (flex-1), nav
       * tabs dead-centre, user menu on the right (flex-1).  The equal
       * flex weights on the outer columns are what keep the nav
       * visually centered regardless of how long the org name gets.
       */}
      {/*
       * Header sits on the SAME Marshmallow canvas as the body so the
       * SaaS portal reads as one continuous brand surface — no
       * white-to-cream seam between chrome and content. The bottom
       * border + subtle backdrop blur keep the chrome distinguishable
       * when the body scrolls under it.
       */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/85 backdrop-blur-sm px-4 md:px-6">
        <div className="flex flex-1  flex-row min-w-0 items-center gap-2">
          <div className="flex items-center gap-2">
          <Link
            to="/app"
            className="flex shrink-0 items-center gap-1.5 font-medium text-foreground"
          >
            <img
              src="/applogo.png"
              alt="Forestack"
              width={20}
              height={20}
              className="rounded"
            />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Forestack
            </span>
          </Link>
       </div>
        {/*
         * Wrapper is sized to 16px tall (`h-4`) so the Separator
         * primitive's built-in `data-[orientation=vertical]:h-full`
         * resolves to a visible height.  We also use `!h-4` as a
         * belt-and-suspenders override because the data-attribute
         * selector in the primitive has higher CSS specificity than
         * a plain `h-4` utility and would otherwise win.
         */}
        <div className="flex h-4 items-center">
          <Separator
            orientation="vertical"
            className="!h-4 bg-border"
          />
        </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <OrgSwitcher org={org} />
          </div>
        </div>

        <nav className="hidden shrink-0 items-center gap-1 md:flex">
          {SAAS_TABS.map((item) => {
            const Icon = item.icon
            return (
              <TabLink
                key={item.id}
                to={item.to}
                params={{ orgId: org.id }}
                active={tab === item.id}
              >
                {Icon ? <Icon className="mr-1.5 h-3.5 w-3.5" /> : null}
                {item.label}
              </TabLink>
            )
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end">
          <UserMenu
            displayName={displayName}
            email={org.email}
            initials={initials}
            onSignOut={handleSignOut}
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}

function TabLink({
  to,
  params,
  active,
  children,
}: {
  to: string
  params: Record<string, string>
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to as any}
      params={params as any}
      className={cn(
        'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? // Active tab carries real brand energy (Hunter Green tint
            // on a soft primary wash) so the selected state reads
            // immediately. Inactive tabs stay quiet on the warm canvas
            // and only pick up muted fill on hover.
            'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {children}
    </Link>
  )
}

function OrgSwitcher({ org }: { org: MyOrganizationDetail }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 min-w-0 max-w-full gap-1.5 px-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Avatar className="h-5 w-5 shrink-0 rounded-sm">
            {org.logoUrl ? <AvatarImage src={org.logoUrl} alt={org.name} /> : null}
            <AvatarFallback className="rounded-sm bg-foreground text-[9px] text-white">
              {org.name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 flex-1 truncate lg:inline">
            {org.name}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Current workspace</DropdownMenuLabel>
        <DropdownMenuItem className="flex flex-col items-start gap-0.5">
          <span className="text-sm font-medium">{org.name}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app">Switch workspace</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UserMenu({
  displayName,
  email,
  initials,
  onSignOut,
}: {
  displayName: string
  email: string
  initials: string
  onSignOut: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2 hover:bg-muted"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-foreground text-xs text-white">
              {initials || '?'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/settings">
            <Settings className="mr-2 h-4 w-4" />
            Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app">
            <Building2 className="mr-2 h-4 w-4" />
            Switch workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

export { WorkspaceShell }
export type { WorkspaceTab }
