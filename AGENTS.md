# AGENTS.md — Forestack (TanStack Start monorepo)

Durable context for coding agents working on this repo. Read this first.

## Project identity

- **Name**: `forestack` (npm workspace root).
- **Origin**: ported from the Next.js app in `../INTERNAL-APP-NEXT/` (that tree
  is still used as *reference only* — do not edit it; copy/translate out of it
  as needed).
- **Purpose**: multi-tenant SaaS for running companies' operations (PLM, CRM,
  WMS, ERP, PM).
- **Structure**: npm workspaces + Turborepo with two deployable apps and one
  shared package (see layout below).
- **Backend**: Supabase (Postgres + Auth + Storage) — same project that the
  Next.js app uses. The CLI add-ons `neon`, `drizzle`, `better-auth` were
  scaffolded by mistake and have been removed from this repo.

## Stack (authoritative)

| Layer                | Choice                                          |
| -------------------- | ----------------------------------------------- |
| Monorepo             | npm workspaces + Turborepo                      |
| Meta framework       | TanStack Start (file-based Router + SSR + server fns) |
| Package manager      | npm                                             |
| Language             | TypeScript                                      |
| UI                   | React 19, Tailwind v4, Radix UI, Reui, Tabler icons, sonner, cmdk |
| Routing              | TanStack Router (auto-generated `routeTree.gen.ts`) |
| Data + Auth          | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| Data (client cache)  | TanStack Query (+ `@tanstack/react-router-ssr-query`) |
| Forms                | TanStack Form (primary) + react-hook-form/zod (legacy ports) |
| Tables               | TanStack Table                                  |
| Local store          | TanStack Store                                  |
| Virtualization       | TanStack Virtual                                |
| Scheduling           | TanStack Pacer                                  |
| Hotkeys              | `@tanstack/react-hotkeys`                       |
| AI                   | `@tanstack/ai` (demo only today)                |
| Hosting              | Cloudflare Workers (via `wrangler`, one worker per app) |
| Code review bot      | CodeRabbit GitHub App (+ `.coderabbit.yaml`)    |

> **Not used**: Neon, Drizzle, Better Auth, ElectricSQL, Sentry. If you see
> references in legacy branches or cache, treat them as stale.

## Scaffolding commands (re-run only if rebooting from zero)

```bash
# Scaffolded originally with:
npx @tanstack/cli@latest create my-tanstack-app \
  --agent \
  --deployment cloudflare \
  --add-ons tanstack-query
#  ^ do NOT re-add neon/drizzle/better-auth/sentry — the backend is Supabase
#    and error monitoring is intentionally off.

# Intent skills:
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

Use Intent skills (`auth-and-guards`, `data-loading`, etc.) whenever you are
doing routing/auth/data-loading work — they encode the TanStack Start
conventions this repo follows.

## Everyday scripts

Run from the **repo root** unless noted.

```bash
npm install                    # install all workspaces

# Dev — studio :3000, workspace :3001
npm run dev:studio
npm run dev:workspace
npm run dev                    # both via turbo (parallel)

# Build
npm run build                  # both via turbo
npm run build:studio
npm run build:workspace

# Deploy (separate Cloudflare Workers)
npm run deploy:studio          # → forestack-studio
npm run deploy:workspace       # → forestack-workspace

npm run lint                   # eslint (root)
npm run format                 # prettier --check
npm run check                  # prettier --write + eslint --fix
```

Regenerate a router tree by running that app's dev server once — the
`@tanstack/router-plugin` Vite plugin writes `routeTree.gen.ts` inside each
app. There is no standalone `tsr generate` script.

## Directory layout

```
forestack/                          # workspace root
  package.json                      # workspaces + turbo scripts
  turbo.json
  .env.example                      # copy → .env.local at root
  supabase/                         # Supabase CLI project (INTERNAL-APPLICATION)
    config.toml
    functions/                      # Edge Functions source (deploy from here)
  packages/
    shared/                         # @forestack/shared
      src/
        components/                 # ui, base, composites, shells, reui, brand; _demos/
        lib/navigation/             # shared NavItem, SidebarSchema types
        hooks/
        integrations/tanstack-query/
        lib/                        # supabase, auth/server-context, utils, theme
        lib/data/                   # _shared, auth/server, storage, user/profile
        styles.css
  apps/
    studio/                         # @forestack/studio — SaaS portal (forestack.dev)
      src/routes/                   # login, onboarding, /app/*, auth/*
      src/features/saas/
      src/lib/data/                 # organizations, onboarding, company-editor, saas-session
      wrangler.jsonc                # worker: forestack-studio
    workspace/                      # @forestack/workspace — tenant portal (*.forestack.space)
      src/routes/$companySlug/      # tenant guard, PLM/CRM/WMS/ERP/PM modules
      src/features/company/
      src/lib/                      # tenant-context, tenant provider, tenant-rewrite
      src/lib/data/                 # plm, crm, erp, pm, dashboard, team, orders, …
      wrangler.jsonc                # worker: forestack-workspace
```

### What lives where

| Concern | Package |
| ------- | ------- |
| UI primitives, composites, shells, Supabase clients, shared auth/utils, theme | `@forestack/shared` |
| Login, signup, onboarding, `/app`, org management, `config/saas.registry.ts` | `@forestack/studio` |
| Tenant routes, module pages, subdomain rewrite, `config/modules.registry.ts` | `@forestack/workspace` |
| Edge Functions (`supabase/functions/`), CLI config | `supabase/` at repo root |

### Supabase Edge Functions

- **Project**: `INTERNAL-APPLICATION` (`ocisdaeugliixyhcjnkv`) — same as `VITE_SUPABASE_URL` in `.env.local`.
- **Source**: `supabase/functions/<name>/` (pulled from the remote project; not present in `../INTERNAL-APP-NEXT/`).
- **Link** (once per machine): `supabase login` then `supabase link --project-ref ocisdaeugliixyhcjnkv` (database password optional for functions-only work).
- **Pull latest**: `npx supabase@latest functions download --project-ref ocisdaeugliixyhcjnkv --use-api` (no Docker; `--use-api` decodes on Supabase servers).
- **Deploy one**: `supabase functions deploy <name> --project-ref ocisdaeugliixyhcjnkv`
- **Deploy all**: `supabase functions deploy --project-ref ocisdaeugliixyhcjnkv`
- **Local serve**: `supabase functions serve` (requires Docker for the edge runtime).
- **Secrets**: set in Supabase dashboard or `supabase secrets set KEY=value` (e.g. `SOFTR_API_KEY`, `PREDIKO_API_KEY`, `SOFTR_SHARED_SECRET`).

### Import aliases

Each app resolves `@/*` to its own `src/` first, then falls back to
`packages/shared/src/`. Most imports stayed unchanged after the split.

## Supabase clients — how to use

- **Browser** (`packages/shared/src/lib/datasource/supabase/client.ts`): call
  `createClient()` from any client component. Uses `@supabase/ssr`
  `createBrowserClient`, keyed by `import.meta.env.VITE_SUPABASE_URL` /
  `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Server** (`packages/shared/src/lib/datasource/supabase/server.ts`): call
  `createClient()` from a `createServerFn` handler, route `loader`, or
  `beforeLoad`. Uses `createServerClient` wired to `getCookies` / `setCookie`
  from `@tanstack/react-start/server`, so Supabase's auth cookies round-trip
  correctly on every SSR request.
- Legacy `lib/data/**/hooks.ts` hooks (in app or shared) call the browser client
  directly — same React Query hooks from the Next.js app.

## Auth flow

- **Session read**: `createClient()` (server) → `supabase.auth.getUser()`. The
  studio `_authed` route does this in `beforeLoad`; if no user, redirect to
  `/login`.
- **Login / signup / forgot / update**: forms in `apps/studio/src/features/saas/*`
  and `apps/workspace/src/features/company/login-portal.tsx` call the browser
  client's `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `updateUser`.
- **Email callback**: `apps/studio/src/routes/auth/confirm.tsx` (and the
  tenant-scoped `apps/workspace/src/routes/$companySlug/auth/confirm.tsx`) is a
  TanStack route with a `beforeLoad` that calls a server fn wrapping
  `exchangeCodeForSession` / `verifyOtp`, then redirects to `next`.
- **Tenant access gate**: `apps/workspace/src/lib/auth/tenant-context.ts` →
  `requireCompanyAccess` queries `app_company_users` to confirm the user is a
  member of the company resolved from `$companySlug`.

## Environment variables

| Variable                      | Where            | Required | Purpose                               |
| ----------------------------- | ---------------- | -------- | ------------------------------------- |
| `VITE_SUPABASE_URL`           | client + server  | yes      | Supabase project URL                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client + server | yes     | Supabase anon/publishable key         |
| `SUPABASE_SERVICE_ROLE_KEY`   | server           | no       | Service-role key for privileged fns   |
| `SAAS_HOST`                   | server           | no       | Studio hostname override              |
| `TENANT_HOST`                 | server           | no       | Tenant hostname override              |
| `DEV_HOST`                    | server           | no       | Local dev host (e.g. `localhost:3001` for workspace) |

Local: copy `.env.example` → `.env.local` at the **repo root**. Both apps load
it via `dotenv -e ../../.env.local`.

Cloudflare: `wrangler secret put <NAME>` in each app directory
(`apps/studio`, `apps/workspace`).

## Deployment (Cloudflare Workers)

Two independent Workers — one per app:

| App | Worker name | Domain |
| --- | ----------- | ------ |
| Studio | `forestack-studio` | `forestack.dev` |
| Workspace | `forestack-workspace` | `*.forestack.space` |

- Each `wrangler.jsonc` pins `main: ./src/server.ts` with
  `compatibility_flags: ["nodejs_compat"]`.
- Build writes to `.output/`; `npm run deploy:<app>` runs `vite build` then
  `wrangler deploy`.
- Supabase client calls over HTTPS so Workers TCP restrictions don't apply.
- Set redirect URLs in Supabase dashboard to include both worker URLs plus
  `http://localhost:3000` (studio) and `{slug}.localhost:3001` (workspace).

**Local tenant testing:** studio at `localhost:3000`; workspace at
`{slug}.localhost:3001`.

## CodeRabbit

- Config lives at `.coderabbit.yaml` and is honored automatically once the
  GitHub App is installed on the repo.
- Install steps:
  1. Go to https://github.com/apps/coderabbitai and install on the owning org.
  2. Grant access to this repository.
  3. Open a PR — CodeRabbit will comment using the rules in `.coderabbit.yaml`.

## Architectural decisions

- **Backend = Supabase, identical to the Next.js app.** Do not reintroduce
  Neon / Drizzle / Better Auth. Anything the Next.js app does with Supabase
  (tables, RPCs, RLS policies, storage buckets) is authoritative.
- **Monorepo = two deployable apps + shared package.** Studio and workspace
  share UI/Supabase code via `@forestack/shared` but build and deploy
  independently to match the production subdomain split.
- **Router-first, not API-first.** For new server-side work, use
  `createServerFn` + the server Supabase client inside route
  `loader` / `beforeLoad`. The legacy `/api/**` Next.js routes are being
  translated to server functions on demand.
- **Tenant resolution happens in the route, not middleware.** Session + company
  membership checks live in `beforeLoad`/`loader` guards on studio `_authed`
  and workspace `$companySlug`. A universal session-refresh middleware lives
  in each app's `src/start.ts`.
- **Subdomain-based portal split.** Studio lives at `forestack.dev`; tenants
  live at `{slug}.forestack.space`. URLs are clean:
  `acme.forestack.space/dashboard` is served by the workspace
  `$companySlug/_authed/_home/dashboard` route via a transparent rewrite
  configured on the workspace router. See
  `apps/workspace/src/lib/routing/tenant-rewrite.ts` for the `input`/`output`
  URL mappers wired into `apps/workspace/src/router.tsx`. The shared helper is
  `packages/shared/src/lib/utils/domain-type.ts` (`whatPortal`, `tenantUrl`,
  `studioUrl`). For cross-portal links (e.g. studio → tenant), **use
  `tenantUrl(slug, path)` — a normal `<Link>` won't cross origins.**

## Gotchas

- `routeTree.gen.ts` is auto-generated per app — never edit by hand. If it
  disappears, run that app's `npm run dev` to regenerate it.
- `Link` from `@tanstack/react-router` is a **named** export, not default.
- `next/navigation` hooks (`useRouter`, `useParams`, `useSearchParams`) have
  TanStack equivalents with different signatures. `useParams` requires a
  `from` route id and returns a synchronous typed object (no `Promise`). For
  dynamic `from`, pass `{ strict: false }`.
- Production composites live in `packages/shared/src/components/composites/`.
  Import from `@/components/composites/*` (not the removed `components/shared/` shims).
- `next/image` has a drop-in shim at
  `packages/shared/src/components/composites/next-image-shim.tsx`. Swap for
  Cloudflare Images later if needed.
- Workspace module nav is centralized in `apps/workspace/src/config/modules.registry.ts`;
  sidebar schemas derive via `schemaFromModule()` in `schema-from-module.tsx`.
- `"use client"` / `"use server"` directives from Next are **not** used in
  TanStack Start. Delete them when porting.
- `@tanstack/react-start` server utilities (`getCookies`, `setCookie`,
  `getRequest`, `setResponseHeader`) must stay in server-only files
  (`*.server.ts`, `src/server/**`, or route `loader`/`beforeLoad` / server
  fns). Do not import them from shared components.
- Many ported legacy files still carry `// @ts-nocheck` because they were
  typed against Supabase's generated `Database` types from the Next.js app.
  If you bring those types into
  `packages/shared/src/lib/datasource/supabase/types/` and wire them into a
  `SupabaseClient<Database>` generic, you can start removing the `@ts-nocheck`
  directives file by file.
- TanStack devtools Vite plugin was removed from production builds (it broke
  tree-shaking); devtools still work in dev via the `AppDevtools` component.

## Migration status

| Area                              | Status                                          |
| --------------------------------- | ----------------------------------------------- |
| Monorepo split (studio/workspace) | done                                            |
| Scaffolding + providers           | done                                            |
| Shared components + libs port     | done (bulk-copied + codemod)                    |
| Supabase clients (browser + SSR)  | done                                            |
| Auth flows (login/signup/forgot)  | done (Supabase auth, matches Next.js app)       |
| Tenant resolver / company auth    | done (`$companySlug` loader in workspace)       |
| Home module (dashboard/team/…)    | done                                            |
| PLM / CRM / WMS / ERP / PM routes | done (pages wired; data hooks reuse legacy Supabase hooks verbatim) |
| Auth `/confirm` callback          | done (server fn exchanges code / OTP)           |
| WorkOS tenant SSO scaffold        | stub (`apps/workspace/src/lib/auth/workos/`)    |
| Final behavior parity verify      | TODO                                            |

### WorkOS tenant SSO (workspace only)

Studio stays on Supabase Auth. Per-org enterprise SSO for tenant portals is
scaffolded under `apps/workspace/src/lib/auth/workos/` with compiling stubs.
Implementation plan: `docs/roadmap/workos-workspace-implementation-plan.md`.
Architecture: `docs/roadmap/split-auth-per-org-idp.md`.

## Next steps (for the next agent)

1. Bring Supabase generated `Database` types from `../INTERNAL-APP-NEXT/` into
   `packages/shared/src/lib/datasource/supabase/types/` and thread them through
   `createClient` so the data hooks become type-safe again. Drop `// @ts-nocheck`
   as you go.
2. Port the legacy `/api/dashboard/orders` aggregation to a
   `createServerFn` that calls `supabase.rpc` or the appropriate query.
3. Once hooks stabilize, migrate the remaining react-hook-form/zod forms to
   TanStack Form where it adds value.
4. `npm run build && npm run deploy:<app>` against a staging environment and
   walk each route in `apps/*/src/routes/` vs its counterpart in
   `../INTERNAL-APP-NEXT/src/app/` for behavior parity.
5. Configure Cloudflare DNS/routes: `forestack.dev` → studio worker,
   `*.forestack.space` → workspace worker; set secrets per worker.

## Agent Skills

**Project onboarding:** load `.cursor/skills/forestack-project/SKILL.md` at the start
of a new session for a compact, current-state reference (monorepo layout, auth,
data/UI conventions, where-to-look table). `AGENTS.md` is the durable deep context;
the skill is the faster catch-up layer.

Skills shipped with installed TanStack packages, surfaced via `@tanstack/intent`.
Load the matching `SKILL.md` into context when working on the task it describes.
Run `npx @tanstack/intent@latest list` to discover all 48 available skills.

<!-- intent-skills:start -->
# Skill mappings - when working in these areas, load the linked skill file into context.
skills:
  - task: "router-core overview: route trees, createRouter, createRoute, createRootRouteWithContext, addChildren, file naming"
    load: "node_modules/@tanstack/router-core/skills/router-core/SKILL.md"
  - task: "host-aware route guards (`$companySlug`, studio `_authed`, tenant-rewrite, `beforeLoad` redirects/notFound)"
    load: "node_modules/@tanstack/router-core/skills/router-core/auth-and-guards/SKILL.md"
  - task: "Link/useNavigate/preloading/scroll restoration/MatchRoute/createLink"
    load: "node_modules/@tanstack/router-core/skills/router-core/navigation/SKILL.md"
  - task: "automatic code splitting / `.lazy.tsx` / `createLazyFileRoute` / per-route `codeSplitGroupings`"
    load: "node_modules/@tanstack/router-core/skills/router-core/code-splitting/SKILL.md"
  - task: "router SSR (`RouterClient`/`RouterServer`, `defaultStreamHandler`, `HeadContent`, head meta/links/scripts)"
    load: "node_modules/@tanstack/router-core/skills/router-core/ssr/SKILL.md"
  - task: "dynamic path segments / splat routes (`$companySlug`, future `$/_splat`)"
    load: "node_modules/@tanstack/router-core/skills/router-core/path-params/SKILL.md"
  - task: "notFound / errorComponent / defaultNotFoundComponent customisation"
    load: "node_modules/@tanstack/router-core/skills/router-core/not-found-and-errors/SKILL.md"
  - task: "search params (dashboard `?days=90`, table filters) with Zod validation"
    load: "node_modules/@tanstack/router-core/skills/router-core/search-params/SKILL.md"
  - task: "route loaders, staleTime/gcTime, pendingComponent, TanStack Query SSR integration"
    load: "node_modules/@tanstack/router-core/skills/router-core/data-loading/SKILL.md"
  - task: "type-safe router (`Register`, `Route.useParams`, `Route.useLoaderData`, `getRouteApi`)"
    load: "node_modules/@tanstack/router-core/skills/router-core/type-safety/SKILL.md"
  - task: "server functions used by route guards (`createServerFn`, `inputValidator`, `useServerFn`)"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-functions/SKILL.md"
  - task: "file-based API routes under `$companySlug/api/**` (`createFileRoute(...).server.handlers`)"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/server-routes/SKILL.md"
  - task: "isomorphic helpers / env boundaries (`createIsomorphicFn` for `currentHost`, `VITE_*` vs `process.env`)"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/execution-model/SKILL.md"
  - task: "request middleware (`createMiddleware`, global middleware via `createStart` in `src/start.ts`)"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/middleware/SKILL.md"
  - task: "Cloudflare Workers deployment (`wrangler.jsonc`, `dist/server/wrangler.json`, prerendering, ISR)"
    load: "node_modules/@tanstack/start-client-core/skills/start-core/deployment/SKILL.md"
  - task: "React-Start specific glue (`createStart`, `getRouter`, `useServerFn`, `StartClient`/`StartServer`)"
    load: "node_modules/@tanstack/react-start/skills/react-start/SKILL.md"
  - task: "loading `.env.local` via `dotenv-cli` in dev/start scripts"
    load: "node_modules/dotenv/skills/dotenv/SKILL.md"
<!-- intent-skills:end -->
