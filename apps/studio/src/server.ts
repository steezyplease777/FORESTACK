import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'

/**
 * Cloudflare worker entry point.
 *
 * We used to do subdomain -> path rewriting here (e.g.
 * `acme.forestack.space/dashboard` -> `/t/acme/dashboard`), but the TanStack
 * Router `rewrite` config in `src/router.tsx` now handles both directions
 * transparently:
 *
 *   rewrite.input  : `/dashboard` on a tenant host becomes `/t/{slug}/dashboard`
 *                    before route matching.
 *   rewrite.output : `/t/{slug}/x` in generated links/Location headers becomes
 *                    `/x` before being written to history.
 *
 * That makes this file a thin pass-through. Keep it so Wrangler has a single
 * `main` entry to bundle via the Cloudflare Vite plugin, and so we have a
 * place to hang future edge-level concerns (e.g. redirects, headers).
 */
const fetch = createStartHandler(defaultStreamHandler)
export default createServerEntry({ fetch })
