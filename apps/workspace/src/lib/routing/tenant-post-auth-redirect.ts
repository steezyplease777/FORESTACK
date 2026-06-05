import { redirect } from '@tanstack/react-router'

import { safeRelativeRedirectPath } from '@/lib/utils/safe-redirect'

const DEFAULT_DASHBOARD_SEARCH = { days: 90, channels: [] as string[] }

/**
 * After magic-link confirm or WorkOS SSO callback, send the user to a safe
 * tenant-visible path. Always prefer typed `to` routes so tenant-rewrite can
 * emit clean URLs (`/dashboard`, not `/auth/dashboard`).
 */
export function tenantPostAuthRedirect(
  companySlug: string,
  next?: string,
): never {
  const destination = safeRelativeRedirectPath(next)

  if (destination === '/' || destination === '/dashboard') {
    throw redirect({
      to: '/$companySlug/dashboard',
      params: { companySlug },
      search: DEFAULT_DASHBOARD_SEARCH,
    })
  }

  // Other absolute in-app paths (/team, /erp/vendors, …) are already
  // tenant-visible; href is fine once safeRelativeRedirectPath validated them.
  throw redirect({ href: destination })
}
