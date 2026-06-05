import { createServerClient } from '@supabase/ssr'
import { getCookies, setCookie } from '@tanstack/react-start/server'

/**
 * Server-side Supabase client for TanStack Start.
 *
 * Mirrors the Next.js `createClient` from the legacy app but uses
 * `getCookies` / `setCookie` from `@tanstack/react-start/server` instead of
 * `next/headers`. Call from loaders, beforeLoad guards, and `createServerFn`
 * handlers.
 */
export function createClient() {
  const url =
    import.meta.env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment.',
    )
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        const all = getCookies()
        return Object.entries(all).map(([name, value]) => ({
          name,
          value: String(value),
        }))
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, options as Parameters<typeof setCookie>[2])
          }
        } catch {
          // Streaming/static contexts may have already flushed headers.
        }
      },
    },
  })
}
