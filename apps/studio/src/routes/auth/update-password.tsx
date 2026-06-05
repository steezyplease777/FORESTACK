import { createFileRoute } from '@tanstack/react-router'
import { UpdatePasswordForm } from '@/features/saas/update-password-form'

export const Route = createFileRoute('/auth/update-password')({
  component: Page,
})

function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <UpdatePasswordForm redirectUrl="/app" />
      </div>
    </div>
  )
}
