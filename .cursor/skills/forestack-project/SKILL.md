---
name: forestack-project
description: >-
  Compact reference for the Forestack TanStack Start monorepo — layout, auth,
  tenant routing, data/UI conventions, scripts, and deployment. Use when
  starting work in this repo, onboarding to a new chat, porting from the Next.js
  reference app, or answering "where does X live?" questions about forestack,
  studio, workspace, Supabase, or Cloudflare Workers.
---

# Forestack project context

Dense onboarding reference for agents. **Do not edit** `../INTERNAL-APP-NEXT/` — copy/translate from it only. Also read `AGENTS.md` at repo root for durable context and TanStack Intent skill mappings.

**Workspace root:** open `INTERNAL-APP-TANSTACK` (not parent `INTERNAL-APP-STUFF`) — `apps/` and `supabase/` live only inside this folder.

## Identity

| | |
|---|---|
| **Name** | `forestack` (npm workspace root) |
| **Purpose** | Multi-tenant SaaS for company operations: PLM, CRM, WMS, ERP, PM |
| **Origin** | Ported from Next.js app at `../INTERNAL-APP-NEXT/` (reference only) |
| **Backend** | Supabase (Postgres + Auth + Storage) — same project as Next.js app |
| **Hosting** | Two Cloudflare Workers: studio + workspace |

**Not used** (stale if seen in branches): Neon, Drizzle, Better Auth, ElectricSQL, Sentry.

## Monorepo layout

```
forestack/
  package.json, turbo.json, .env.example → .env.local
  AGENTS.md                    # primary agent doc + Intent skill index
  packages/shared/             # @forestack/shared
  apps/studio/                 # @forestack/studio — SaaS portal
  apps/workspace/              # @forestack/workspace — tenant portal
  supabase/                    # Edge Functions (INTERNAL-APPLICATION project)
```

### What lives where

| Concern | Location |
| ------- | -------- |
| UI primitives, theme, Supabase clients, shared auth/utils | `packages/shared/src/` |
| Login, signup, onboarding, `/app`, org management | `apps/studio/` |
| Tenant routes, modules, subdomain rewrite, module registry | `apps/workspace/` |
| Edge Functions (deploy/pull) | `supabase/functions/` — project ref `ocisdaeugliixyhcjnkv` |

### Import alias `@/*`

Each app's `tsconfig.json` resolves `@/*` → **app `src/` first**, then `packages/shared/src/`:

```json
"@/*": ["./src/*", "../../packages/shared/src/*"]
```

Vite uses `tsconfigPaths: true`. Most imports unchanged after monorepo split.

## Stack

| Layer | Choice |
| ----- | ------ |
| Monorepo | npm workspaces + Turborepo |
| Framework | TanStack Start (Router + SSR + server fns) |
| UI | React 19, Tailwind v4, Radix/shadcn, Reui, Tabler icons, sonner, cmdk |
| Data + Auth | Supabase (`@supabase/ssr`) |
| Client cache | TanStack Query + `@tanstack/react-router-ssr-query` |
| Forms | TanStack Form (preferred) + react-hook-form/zod (legacy ports) |
| Tables / store / virtual / pacer / hotkeys | TanStack Table, Store, Virtual, Pacer, Hotkeys |
| Deploy | Cloudflare Workers via `wrangler` |

## Scripts (repo root)

```bash
npm install
npm run dev:studio      # :3000
npm run dev:workspace   # :3001
npm run dev             # both (turbo)
npm run build[:studio|:workspace]
npm run deploy:studio   # → forestack-studio
npm run deploy:workspace # → forestack-workspace
npm run lint | format | check
```

`routeTree.gen.ts` is auto-generated per app — run that app's dev server to regenerate. Never edit by hand.

## Apps in detail

### Studio (`apps/studio`) — `forestack.dev`

**Routes** (`src/routes/`):

- Public: `login`, `onboarding`, `auth/*` (sign-up, forgot-password, confirm, update-password)
- Protected (`_authed/`): `/app/*` — org dashboard, companies, users, settings, workspaces
- `auth/confirm.tsx` — email callback via server fn

**Features** (`src/features/saas/`): login/signup/forgot portals, workspace/company edit dialogs, `workspace-shell.tsx`

**Data** (`src/lib/data/`): `auth/saas-session`, `organizations/`, `onboarding/`, `company-editor/`

**Auth gate**: `_authed.tsx` → `loadSaasSessionStatus()` via `ensureQueryData`; redirects unauthed → `/login`, wrong-host → studio URL.

### Workspace (`apps/workspace`) — `*.forestack.space`

**Routes** (`src/routes/$companySlug/`):

- Public: `login`, `access-denied`, `auth/confirm`, `auth/workos-callback`
- `$companySlug/route.tsx` — company context loader (no auth redirect; public pages work)
- `$companySlug/_authed/` — auth + membership gate
- Modules under `_authed/`: `_home/` (dashboard, team), `wms/`, `crm/`, `erp/`, `plm/`, `pm/`, `account`

**Features** (`src/features/company/`):

- `pages/{module}/` — route-facing page components + per-module sidebars
- `modules/` — reusable module UI (tables, forms, dashboard widgets)
- `components/` — `portal-shell`, headers, nav, module-switcher, my-stack panel
- `login-portal.tsx`, `auth/login-dispatcher.tsx`, `auth/workos-login-button.tsx`, `tenant-provider.tsx`
- `lib/auth/workos/` — WorkOS AuthKit + Supabase Third-Party Auth stubs (see `docs/roadmap/workos-workspace-implementation-plan.md`)

**Config** (`src/config/`):

- `modules.registry.ts` — `MODULE_REGISTRY`, nav items, themes for WMS/CRM/ERP/PM/PLM
- `schema-from-module.tsx` — sidebar schemas from registry

**Data** (`src/lib/data/`): per-module domains + `portal-bundles/{wms,crm,erp,plm,pm}/` for module index pages

## Portal split & routing

### Host detection

`packages/shared/src/lib/utils/domain-type.ts`:

| Portal | Production | Local dev |
| ------ | ---------- | --------- |
| STUDIO | `forestack.dev` | `localhost:3000` |
| TENANT | `{slug}.forestack.space` | `{slug}.localhost:3001` (workspace port) |

Helpers: `whatPortal(host)`, `currentHost()` (isomorphic), `tenantUrl(slug, path)`, `studioUrl(path)`.

**Cross-portal links** must use `tenantUrl` / `studioUrl` — `<Link>` cannot cross origins.

Override hosts via `SAAS_HOST`, `TENANT_HOST`, `DEV_HOST` in `.env.local`.

### Tenant URL rewrite (workspace only)

`apps/workspace/src/lib/routing/tenant-rewrite.ts` + `router.tsx`:

- User sees `/dashboard`; router matches `/$companySlug/dashboard` (slug from host)
- `rewrite.input`: `/dashboard` → `/{slug}/dashboard`
- `rewrite.output`: `/{slug}/x` → `/x`
- Internal paths (`/_*`, `/@*`) bypass rewrite (server fns, Vite HMR)

### Auth flow summary

1. **Session refresh**: both apps' `src/start.ts` — middleware calls `supabase.auth.getUser()` on every request
2. **Studio**: `_authed` checks session via `loadSaasSessionStatus`
3. **Workspace**: `$companySlug/route.tsx` loads company + user + membership; `_authed` redirects if no user → login, no membership → access-denied
4. **Tenant membership**: `apps/workspace/src/lib/auth/tenant-context.ts` → `requireCompanyAccess` queries `app_company_users`
5. **Browser auth**: forms call Supabase client `signInWithPassword`, `signUp`, etc.
6. **Email confirm**: `auth/confirm` routes exchange code/OTP via server fn

### Supabase clients

| | Path | Use in |
|---|------|--------|
| Browser | `packages/shared/src/lib/datasource/supabase/client.ts` | Client components, legacy hooks |
| Server | `packages/shared/src/lib/datasource/supabase/server.ts` | `createServerFn`, `loader`, `beforeLoad` |

Server client wires cookies via `getCookies`/`setCookie` from `@tanstack/react-start/server`.

**Types**: `packages/shared/src/lib/datasource/supabase/types/database.types.ts` exists (large generated `Database` type). Many files still use `// @ts-nocheck` — thread types through `createClient<Database>()` incrementally.

## Data layer conventions

Canonical doc: `packages/shared/src/lib/data/README.md`

### Per-domain file layout

| File | Role |
| ---- | ---- |
| `keys.ts` | Hierarchical `queryKey` factory |
| `types.ts` | Row/DTO types (no server imports) |
| `server.ts` | Top-level `createServerFn` only — **never wrap in factories** (Start plugin) |
| `queries.ts` | `{ queryKey, queryFn, staleTime }` for loaders + hooks |
| `mutations.ts` | Invalidation helpers |
| `hooks.ts` | Thin `useQuery` / `useMutation` wrappers |
| `index.ts` | Barrel (hooks, queries, keys, types) — not `server.ts` |

### Shared helpers (`lib/data/_shared/`)

- `query-policy.ts` — stale/gc times
- `rpc-errors.ts` — error normalization
- `pagination.ts` — list pagination
- `auth.ts` — `requireAuthedSupabase` for workspace server fns

### Rules

- Loaders and hooks share the same query factory (no duplicated keys/fns)
- Mutations invalidate via `keys.ts` + portal bundle keys when home index depends on entity
- New server work: `createServerFn` + server Supabase client — not legacy `/api/**` routes
- `portal-bundles/` aggregates module overview data (one server round-trip per module index)

### Migration state (data)

- **New pattern** (`keys/queries/server/hooks`): PLM products, dashboard, team, user/tenant, portal-bundles, some ERP
- **Legacy pattern** (`client.ts` + hooks calling browser Supabase): many CRM/PM/PLM/ERP domains still `@ts-nocheck`

## UI layer conventions

### Component tiers (`packages/shared/src/components/`)

| Dir | Purpose |
| --- | ------- |
| `ui/` | shadcn/Radix primitives |
| `base/` | Reui-style base components |
| `composites/` | Page header, empty state, loading skeleton, error boundary |
| `shared/` | Legacy aliases (prefer `composites/`) |
| `brand/` | Forestack branding |
| `_demos/` | Demo/showcase only — not production |

### Workspace shell

`PortalShell` (`features/company/components/portal-shell.tsx`):

- Shared header (`PortalHeader`) + per-portal sidebar prop
- App-shell model: `h-dvh overflow-hidden`, no document scroll
- MyStack panel (FAB) rides beside main shell

Sidebars: declarative `SidebarSchema` (`lib/navigation/types.ts`) + `sidebar-profiles/` renderers. Module nav from `MODULE_REGISTRY` via `schema-from-module.tsx`.

### Studio shell

`features/saas/components/workspace-shell.tsx` for org admin UI.

### Code style

`.cursor/rules/exports-at-bottom.mdc` — declare symbols unexported in body, export block at file bottom (hand-written `src/**` only; skip generated/shadcn files).

### Porting from Next.js

- Remove `"use client"` / `"use server"`
- `Link` from `@tanstack/react-router` is a **named** export
- `useParams` needs `from` route id; pass `{ strict: false }` for dynamic routes
- `next/image` → `packages/shared/src/components/composites/next-image-shim.tsx`
- Server utilities (`getCookies`, etc.) only in server files / loaders / server fns

## Environment variables

Copy `.env.example` → `.env.local` at **repo root**. Apps load via `dotenv -e ../../.env.local`.

| Variable | Required | Purpose |
| -------- | -------- | ------- |
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | Anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Privileged server fns |
| `SAAS_HOST` | no | Studio hostname (default `forestack.dev`) |
| `TENANT_HOST` | no | Tenant root (default `forestack.space`) |
| `DEV_HOST` | no | Local studio host (default `localhost:3000`) |

Cloudflare secrets: `wrangler secret put <NAME>` in `apps/studio` or `apps/workspace`.

Set Supabase redirect URLs for both worker domains + local origins.

## Deployment

| App | Worker | Domain | Config |
| --- | ------ | ------ | ------ |
| Studio | `forestack-studio` | `forestack.dev` | `apps/studio/wrangler.jsonc` |
| Workspace | `forestack-workspace` | `*.forestack.space` | `apps/workspace/wrangler.jsonc` |

- `main: ./src/server.ts`, `compatibility_flags: ["nodejs_compat"]`
- Build → `.output/`; deploy = `vite build && wrangler deploy`

## Migration status

| Area | Status |
| ---- | ------ |
| Monorepo split | done |
| Supabase clients (browser + SSR) | done |
| Auth flows + `/confirm` | done |
| Tenant resolver + company auth | done |
| Module routes (PLM/CRM/WMS/ERP/PM + home) | done (pages wired) |
| Module registry + unified sidebar | done |
| Supabase `Database` types file | present; not fully threaded |
| Data layer refactor (server fns + query factories) | partial |
| Final behavior parity vs Next.js | TODO |
| Cloudflare DNS/routes in prod | TODO |

## Gotchas

- `routeTree.gen.ts` — generated; dev server regenerates
- Tenant rewrite must skip `/_serverFn` paths or auth breaks (307 loop)
- `$companySlug` loader validates slug before host redirect (prevents studio swallowing bad paths)
- Company context cached 5min via React Query key `['companyContext', slug]`
- Saas session cached 30s via `['saasSession']`
- Router `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 30_000` (workspace)
- TanStack devtools Vite plugin removed from prod builds; dev via `AppDevtools`
- `DEV_HOST` defaults to `localhost:3000` but workspace dev runs on **3001** — align `DEV_HOST` or use `{slug}.localhost:3001` for local tenant testing

## Where to look

| Task | Start here |
| ---- | ---------- |
| Add studio route | `apps/studio/src/routes/` |
| Add tenant route | `apps/workspace/src/routes/$companySlug/_authed/{module}/` |
| Auth guard (studio) | `apps/studio/src/routes/_authed.tsx`, `lib/data/auth/saas-session.ts` |
| Auth guard (tenant) | `$companySlug/route.tsx`, `_authed.tsx`, `lib/auth/tenant-context.ts` |
| Subdomain / cross-portal URLs | `packages/shared/src/lib/utils/domain-type.ts` |
| Tenant URL rewrite | `apps/workspace/src/lib/routing/tenant-rewrite.ts`, `router.tsx` |
| Module nav / themes | `apps/workspace/src/config/modules.registry.ts` |
| New data domain | `packages/shared/src/lib/data/README.md`, copy `plm/products/` pattern |
| Portal overview data | `apps/workspace/src/lib/data/portal-bundles/{module}/` |
| UI primitive | `packages/shared/src/components/ui/` |
| Page layout | `portal-shell.tsx`, `page-content.tsx`, `page-header.tsx` |
| Supabase types | `packages/shared/src/lib/datasource/supabase/types/` |
| Edge Functions | `supabase/functions/<name>/` — pull: `python3 scripts/sync-edge-functions.py` |
| Compare with Next.js | `../INTERNAL-APP-NEXT/src/app/` (same routes, different framework) |
| TanStack conventions | `AGENTS.md` Intent skills block; `npx @tanstack/intent@latest list` |
| Deploy / wrangler | `apps/*/wrangler.jsonc`, `apps/*/src/server.ts` |

## TanStack Intent skills (load when relevant)

From `AGENTS.md` — load matching `node_modules/.../SKILL.md` for:

- Router: auth-and-guards, data-loading, navigation, search-params, type-safety
- Start: server-functions, server-routes, middleware, execution-model, deployment
- React Start glue: `node_modules/@tanstack/react-start/skills/react-start/SKILL.md`

## Maintenance notes

Update this skill when:

- New modules or routes are added
- Edge Functions added/renamed in Supabase (re-run `scripts/sync-edge-functions.py`)
- Data layer migration advances (legacy `client.ts` → `server.ts` pattern)
- `Database` types are threaded and `@ts-nocheck` files shrink
- Deployment domains or env vars change
- Behavior parity checklist completes
