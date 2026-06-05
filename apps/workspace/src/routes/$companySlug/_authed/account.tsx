import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { AccountSettingsPage } from '@/features/company/pages/account/account-settings-page'

/**
 * Account settings — a standalone page hosted OUTSIDE `PortalShell`.
 *
 * Every other route under `_authed/*` wraps itself in `PortalShell`
 * (left sidebar + MyStack + zoomed content area). This one doesn't:
 * the page component owns the entire viewport below the tenant
 * header and provides its own "Back to Portal" affordance. That
 * keeps settings out of the sidebar, out of the zoom wrapper, and
 * out of any module-specific chrome — it's a place you *leave* a
 * portal to go to, not a tab inside one.
 *
 * Active section is held in `?section=…` so the browser back button
 * moves between sections naturally and deep-links preserve position.
 */
const accountSearch = z.object({
  section: z
    .enum(['profile', 'security', 'notifications'])
    .catch('profile'),
  // Absolute path+search (e.g. `/pm/campaigns/abc?tab=feed`) to
  // return to when "Back to Portal" is clicked. Set by the user menu
  // when opening settings; missing on direct visits or deep links,
  // in which case the page falls back to the portal home.
  // Constrained to same-origin paths so the `href` we wire up can't
  // be steered at arbitrary URLs via a crafted link.
  from: z
    .string()
    .refine((s) => s.startsWith('/') && !s.startsWith('//'))
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute(
  '/$companySlug/_authed/account',
)({
  validateSearch: accountSearch,
  component: AccountSettingsPage,
})
