# Forestack data layer (`@forestack/shared` + app `lib/data`)

Conventions for TanStack Query + `createServerFn` domains.

## Per-domain layout

| File | Role |
|------|------|
| `keys.ts` | Hierarchical `queryKey` factory |
| `types.ts` | Row/DTO types (no server imports) |
| `server.ts` | Top-level `createServerFn` only — never wrap in factories (Start plugin requirement) |
| `queries.ts` | `{ queryKey, queryFn, staleTime }` factories for loaders + hooks |
| `mutations.ts` | Invalidation helpers + shared mutation `onSuccess` |
| `hooks.ts` | Thin `useQuery` / `useMutation` wrappers |
| `index.ts` | Optional barrel: hooks, queries, keys, types — **not** `server.ts` |

## Shared (`_shared/`)

- `query-policy.ts` — `DEFAULT_LIST_STALE_TIME`, `BUNDLE_STALE_TIME`, gc times
- `rpc-errors.ts` — `normalizeRpcError`, `normalizeBundleError`
- `pagination.ts` — list pagination helpers
- `auth.ts` — `requireAuthedSupabase` for workspace server fns

## Rules

- Loaders and hooks must share the same query factory (no duplicated `queryKey` / `queryFn`).
- Mutations invalidate via `keys.ts` prefixes + portal bundle keys when the home index depends on the entity.
- Keep legacy re-exports during migration (`client.ts` → `types.ts`, old hook exports).
