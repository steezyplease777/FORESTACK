/**
 * Shared TanStack Query cache policy for Forestack data layers.
 *
 * Import from `@/lib/data/_shared/query-policy` in apps (workspace/studio
 * resolve `@/*` to `packages/shared` for paths that do not exist locally).
 */

/** Paginated lists, search, and other high-churn entity collections. */
export const DEFAULT_LIST_STALE_TIME = 60_000

/** Reference data that changes rarely (categories, style pickers, etc.). */
export const DEFAULT_REFERENCE_STALE_TIME = 5 * 60_000

/**
 * Portal bundle RPCs: single source of truth for the session until an
 * explicit invalidation or full reload.
 */
export const BUNDLE_STALE_TIME = Infinity

/**
 * After the user leaves a portal, hold bundle data for cheap back-navigation,
 * then allow garbage collection.
 */
export const BUNDLE_GC_TIME = 1000 * 60 * 30

/** Default heap retention for standard list/detail queries. */
export const DEFAULT_GC_TIME = 1000 * 60 * 5
