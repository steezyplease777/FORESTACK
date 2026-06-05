import { createFileRoute } from '@tanstack/react-router'
import { ForgotPasswordForm } from '@/features/saas/forgot-password-form'

export const Route = createFileRoute('/auth/forgot-password')({
  component: Page,
})

function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
