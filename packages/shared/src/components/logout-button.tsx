import { useNavigate } from '@tanstack/react-router'

import { signOutFn } from '@/lib/data/auth/server'
import { Button } from '@/components/ui/button'

export function LogoutButton({ companySlug }: { companySlug: string }) {
  const navigate = useNavigate()

  const logout = async () => {
    await signOutFn()
    navigate({
      to: '/$companySlug/login',
      params: { companySlug },
    })
  }

  return <Button onClick={logout}>Logout</Button>
}
