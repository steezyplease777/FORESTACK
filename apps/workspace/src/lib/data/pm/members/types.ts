/**
 * Client types for `pm_project_members`.
 *
 * A project member is an `app_company_users` row tied to a specific
 * project. The row doubles as the allowed-assignee pool for that
 * project's tasks and sub-items — task pickers only show users who
 * already appear in this list.
 */
export type PmProjectMember = {
  id: string
  project_id: string
  company_user_id: string
  company_id: string
  role: string | null
  created_at: string
}

/**
 * The denormalized shape the UI actually renders. We join through
 * `app_company_users` → `app_organization_users` to get the display
 * fields in one round-trip; see `getProjectMembers` for the exact
 * PostgREST select that produces this.
 */
export type PmProjectMemberWithUser = PmProjectMember & {
  firstName: string | null
  lastName: string | null
  email: string | null
  profilePictureUrl: string | null
}
