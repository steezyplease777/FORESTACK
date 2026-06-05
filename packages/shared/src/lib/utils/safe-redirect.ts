/** Reject protocol-relative open redirects (`//evil.com`). */
export function safeRelativeRedirectPath(
  next: string | undefined,
  fallback = '/',
): string {
  if (next?.startsWith('/') && !next.startsWith('//')) return next
  return fallback
}
