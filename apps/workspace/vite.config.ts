import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)

/** Server-only secrets the Cloudflare worker reads via `cloudflare:workers` env. */
const WORKER_SECRET_KEYS = [
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_AUTH_DOMAIN',
  'WORKOS_AUTH_ENABLED',
  'WORKOS_REDIRECT_URI',
  'WORKOS_DEV_ORGANIZATION_ID',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const

function workerSecretDefine(
  target: 'process.env' | 'import.meta.env',
): Record<string, string> {
  return Object.fromEntries(
    WORKER_SECRET_KEYS.map((key) => [
      `${target}.${key}`,
      JSON.stringify(process.env[key] ?? ''),
    ]),
  )
}

/**
 * Tenant subdomain routing via TanStack Router `rewrite` in `src/router.tsx`
 * and `src/lib/routing/tenant-rewrite.ts` (workspace-only).
 */
const config = defineConfig({
  // Monorepo `.env.local` lives at the repo root (see root package.json / .env.example).
  envDir: repoRoot,
  resolve: { tsconfigPaths: true },
  // Workspace dev tenants use `{slug}.localhost:3001`; expose DEV_HOST to the
  // client bundle so `whatPortal` / `tenantUrl` agree with the dev server port.
  define: {
    'import.meta.env.DEV_HOST': JSON.stringify(
      process.env.DEV_HOST ?? 'localhost:3001',
    ),
  },
  // SSR / server-fn bundle runs in workerd. Inline secrets from the dev
  // process env (populated by dotenv-cli) so server functions can read them.
  environments: {
    ssr: {
      define: {
        ...workerSecretDefine('process.env'),
        ...workerSecretDefine('import.meta.env'),
      },
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
