// @ts-nocheck
/**
 * Type-only module. Team reads run through `server.ts` via `createServerFn`;
 * this file only holds the shared `TeamMember` shape.
 */
export type TeamMember = {
  id: string
  orgUserId: string
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  profilePictureUrl: string | null
  departmentName: string | null
  titleName: string | null
  lastSeen: string | null
  memberSince: string
}
