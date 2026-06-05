export {
  getWorkOsEnv,
  isWorkOsAuthEnabled,
  isWorkOsConfigured,
  requireWorkOsEnv,
  workOsApiOrigin,
  workOsIssuerUrl,
  type WorkOSEnv,
} from '@/lib/auth/workos/config'

export { getWorkOSAuthorizationUrlFn } from '@/lib/auth/workos/get-authorization-url'
export type {
  GetWorkOSAuthorizationUrlInput,
  GetWorkOSAuthorizationUrlResult,
} from '@/lib/auth/workos/get-authorization-url'

export { handleWorkOSCallbackFn } from '@/lib/auth/workos/handle-callback'
export type {
  HandleWorkOSCallbackInput,
  HandleWorkOSCallbackResult,
} from '@/lib/auth/workos/handle-callback'

export { resolveOrgIdpFn } from '@/lib/auth/workos/resolve-org-idp'
export type { ResolvedOrgIdp } from '@/lib/auth/workos/resolve-org-idp'

export {
  WorkOSNotConfiguredError,
  workOsConfigFromRow,
  type WorkOSAuthorizeInput,
  type WorkOSConnectionConfig,
  type WorkOSJwtClaims,
  type WorkOSTokenResponse,
} from '@/lib/auth/workos/types'
