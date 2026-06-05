/**
 * Writes apps/workspace/.dev.vars from repo-root .env.local so wrangler dev
 * injects server secrets into the Workers runtime (WorkOS, service role, etc.).
 *
 * Run automatically via `predev`; safe to run manually after editing .env.local.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(workspaceRoot, '../..')
const envLocal = path.join(repoRoot, '.env.local')
const devVars = path.join(workspaceRoot, '.dev.vars')

const KEYS = [
  'WORKOS_API_KEY',
  'WORKOS_CLIENT_ID',
  'WORKOS_AUTH_DOMAIN',
  'WORKOS_AUTH_ENABLED',
  'WORKOS_REDIRECT_URI',
  'WORKOS_DEV_ORGANIZATION_ID',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
]

if (!existsSync(envLocal)) {
  console.warn('[sync-dev-vars] No .env.local at repo root; skipping .dev.vars')
  process.exit(0)
}

const lines = readFileSync(envLocal, 'utf8').split('\n')
const parsed = new Map()

for (const line of lines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }
  parsed.set(key, value)
}

const out = KEYS.filter((key) => parsed.has(key) && parsed.get(key))
  .map((key) => `${key}=${parsed.get(key)}`)
  .join('\n')

writeFileSync(devVars, out ? `${out}\n` : '')
console.log(`[sync-dev-vars] Wrote ${devVars} (${KEYS.filter((k) => parsed.has(k)).length} keys)`)
