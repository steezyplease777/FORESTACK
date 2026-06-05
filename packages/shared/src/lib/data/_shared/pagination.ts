/**
 * Shared pagination contract used by every paginated list endpoint
 * in the app. The goal is one round-trip per page (rows + total in
 * a single Supabase call via `count: 'exact'`), server-driven search
 * (so filters respect the page size instead of spraying 10k rows to
 * the client), and predictable TanStack Query keys so cache stays
 * tight across page/search permutations.
 *
 * Consumers:
 * - Server fns call `computeRange(params)` to translate a
 *   (page, pageSize) pair into PostgREST's 0-based inclusive range.
 * - The `.select(..., { count: 'exact' })` from the same call
 *   populates the outer `count` field; we wrap both into
 *   `PaginatedResult<T>` before returning.
 * - Hooks add `{ page, pageSize, q }` to the query key and flip on
 *   `placeholderData: keepPreviousData` so navigation feels instant.
 * - Page components render a pagination footer from the `total` /
 *   `pageSize` pair (no second call required).
 */

export const DEFAULT_PAGE_SIZE = 50
export const MAX_PAGE_SIZE = 200

export type PaginationParams = {
  page: number
  pageSize: number
  /** Optional free-text search; server decides which columns match. */
  q?: string
}

export type PaginatedResult<T> = {
  rows: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * Normalize caller-supplied pagination args into a safe, bounded
 * `{ page, pageSize }` pair — clamps absurd pageSize values and
 * rejects zero/negative pages so the range math stays sane.
 */
export function normalizePagination(
  input: Partial<PaginationParams> | undefined,
): { page: number; pageSize: number; q: string } {
  const page = Math.max(1, Math.floor(input?.page ?? 1))
  const rawSize = input?.pageSize ?? DEFAULT_PAGE_SIZE
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(rawSize)))
  const q = (input?.q ?? '').trim()
  return { page, pageSize, q }
}

/**
 * Convert a 1-based (page, pageSize) pair to PostgREST's 0-based
 * inclusive `[from, to]` range. Exported so server fns don't have
 * to re-derive the arithmetic.
 */
export function computeRange(page: number, pageSize: number): {
  from: number
  to: number
} {
  const from = (page - 1) * pageSize
  return { from, to: from + pageSize - 1 }
}

export function totalPages(total: number, pageSize: number): number {
  if (total <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}

/**
 * Escape characters that have special meaning inside PostgREST's
 * `ilike` pattern so user-typed search strings don't accidentally
 * turn into wildcards (e.g. a `%` typed by the user should match
 * a literal `%`, not "everything").
 */
export function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}
