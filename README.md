# Forestack

Multi-tenant operations platform (PLM, CRM, WMS, ERP, PM) — TanStack Start monorepo.

| App | Package | Dev port | Deploy target |
| --- | --- | --- | --- |
| Studio (SaaS) | `@forestack/studio` | 3000 | `forestack-studio` worker |
| Workspace (tenant) | `@forestack/workspace` | 3001 | `forestack-workspace` worker |

Shared UI and data live in `@forestack/shared` (`packages/shared`).

## Repository layout

Open **`INTERNAL-APP-TANSTACK`** as the Cursor/VS Code workspace root (not the parent `INTERNAL-APP-STUFF` folder).

| What | Path |
| --- | --- |
| Studio app | `apps/studio/` — dev port 3000 |
| Workspace app | `apps/workspace/` — dev port 3001 |
| Studio SaaS `/app` routes | `apps/studio/src/routes/_authed/app/` |
| Tenant module routes | `apps/workspace/src/routes/$companySlug/` |
| Shared package | `packages/shared/` |
| Edge Functions | `supabase/functions/` — see `supabase/functions/README.md` |

## Setup

```bash
npm install
cp .env.example .env.local   # at repo root — both apps load this in dev
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

For local tenant URLs on workspace, set `DEV_HOST=localhost:3001`.

## Development

```bash
npm run dev:studio      # http://localhost:3000
npm run dev:workspace   # http://localhost:3001 — e.g. acme.localhost:3001
npm run dev             # both via Turborepo
```

## Build & deploy

```bash
npm run build
npm run build:studio
npm run build:workspace
npm run deploy:studio
npm run deploy:workspace
```

## Supabase Edge Functions

Edge function source lives at `supabase/functions/` (project **INTERNAL-APPLICATION**, ref `ocisdaeugliixyhcjnkv`). Pull and deploy with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref ocisdaeugliixyhcjnkv   # optional DB password for migrations

# Pull all deployed functions (no Docker)
npx supabase@latest functions download --project-ref ocisdaeugliixyhcjnkv --use-api

# Deploy after edits
supabase functions deploy <function-name> --project-ref ocisdaeugliixyhcjnkv
```

See **`AGENTS.md`** for secrets, local `functions serve`, and the full function list.

## Docs for agents & contributors

- **`AGENTS.md`** — durable architecture and conventions
- **`.cursor/skills/forestack-project/SKILL.md`** — compact onboarding reference
- **`docs/roadmap/`** — feature roadmaps

Reference Next.js app (read-only): `../INTERNAL-APP-NEXT/`
