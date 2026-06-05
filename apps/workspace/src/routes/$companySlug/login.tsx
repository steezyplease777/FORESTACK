import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { LoginDispatcher } from '@/features/company/auth/login-dispatcher'

const parentRoute = getRouteApi('/$companySlug')

export const Route = createFileRoute('/$companySlug/login')({
  component: CompanyLoginPage,
})

function CompanyLoginPage() {
  const { company } = parentRoute.useLoaderData()
  const { companySlug } = Route.useParams()
  const companyName = 'name' in company ? company.name : ''
  const companyLogo = 'logo_url' in company ? company.logo_url : null
  const organizationId =
    'organizationId' in company ? company.organizationId : ''

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-[#FFFFFF]">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <img
              src="/applogo.png"
              alt="Forestack"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-md font-semibold uppercase tracking-wide text-foreground">
              Forestack {companyName ? `| ${companyName}` : ''}
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginDispatcher
              organizationId={organizationId}
              companySlug={companySlug}
            />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:grid grid-cols-1 place-items-center drop-shadow-sm">
        <div className="w-3/4 bg-[#FFFFFF] rounded-xl drop-shadow-xl">
          {companyLogo && (
            <img
              src={companyLogo}
              alt={companyName}
              className="object-contain shadow-lg rounded-xl"
            />
          )}
        </div>
      </div>
    </div>
  )
}
