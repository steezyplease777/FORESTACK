import { getRequest } from '@tanstack/react-start/server'

/**
 * Server-only: read the `Host` header off the current request.
 *
 * Must live in a `.server.ts` file so the TanStack import-protection plugin
 * doesn't let it bleed into the client bundle. Pair with
 * `currentHost` in `./domain-type` which calls this via `createIsomorphicFn`.
 */
export function readRequestHost(): string {
  return getRequest()?.headers.get('host') ?? ''
}
