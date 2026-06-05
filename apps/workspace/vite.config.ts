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
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
