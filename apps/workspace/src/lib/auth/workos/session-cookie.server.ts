import { getCookies, setCookie } from '@tanstack/react-start/server'

/** httpOnly cookie holding the WorkOS access token for Supabase Third-Party Auth. */
export const WORKOS_ACCESS_TOKEN_COOKIE = 'workos-access-token'

const COOKIE_MAX_AGE_SEC = 60 * 60

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

export function getWorkOsAccessTokenFromCookies(): string | undefined {
  const cookies = getCookies()
  const value = cookies[WORKOS_ACCESS_TOKEN_COOKIE]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

export function setWorkOsAccessTokenCookie(accessToken: string): void {
  setCookie(
    WORKOS_ACCESS_TOKEN_COOKIE,
    accessToken,
    cookieOptions(COOKIE_MAX_AGE_SEC),
  )
}

export function clearWorkOsAccessTokenCookie(): void {
  setCookie(WORKOS_ACCESS_TOKEN_COOKIE, '', cookieOptions(0))
}
