import {
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { ShieldX } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/logout-button'

export const Route = createFileRoute('/$companySlug/access-denied')({
  // Authed users who lack company membership land here. If the session is
  // gone (eg. cookies cleared on this page then refresh), send them back to
  // login so they can't stay stuck on a dead-end page.
  beforeLoad: ({ context, params }) => {
    const userId = (context as { userId?: string | null }).userId ?? null
    if (!userId) {
      throw redirect({
        to: '/$companySlug/login',
        params: { companySlug: params.companySlug },
      })
    }
  },
  component: AccessDeniedPage,
})

function AccessDeniedPage() {
  const { companySlug } = Route.useParams()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 text-center">
      <ShieldX className="mb-4 h-12 w-12 text-muted-foreground" />
      <h1 className="text-xl font-semibold">Access Denied</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Contact your administrator for further help.
      </p>
      <div className="mt-6 flex gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate({
              to: '/$companySlug/login',
              params: { companySlug },
            })
          }
        >
          Try a different account
        </Button>
        <LogoutButton companySlug={companySlug} />
      </div>
    </div>
  )
}
