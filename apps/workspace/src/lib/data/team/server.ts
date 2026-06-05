// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import { requireAuthedSupabase } from '@/lib/data/_shared/auth'

import type { TeamMember } from './client'

export const getCompanyUsers = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<TeamMember[]> => {
    const { supabase } = await requireAuthedSupabase()
    const { data: rows, error } = await supabase
      .from('app_company_users')
      .select(
        `
        id,
        created_at,
        last_seen,
        org_user_id (id, first_name, last_name, email, phone, profile_picture_url),
        department_title_id (id, name, department_id (id, name))
      `,
      )
      .eq('company_id', data.companyId)
    if (error) throw new Error(error.message)
    return (rows ?? []).map((row) => {
      const orgUser = Array.isArray(row.org_user_id) ? row.org_user_id[0] : row.org_user_id
      const title = Array.isArray(row.department_title_id)
        ? row.department_title_id[0]
        : row.department_title_id
      const dept = title?.department_id
      const department = Array.isArray(dept) ? dept[0] : dept
      return {
        id: row.id,
        orgUserId: orgUser?.id ?? '',
        firstName: orgUser?.first_name ?? null,
        lastName: orgUser?.last_name ?? null,
        email: orgUser?.email ?? '',
        phone: orgUser?.phone ?? null,
        profilePictureUrl: orgUser?.profile_picture_url ?? null,
        departmentName: department?.name ?? null,
        titleName: title?.name ?? null,
        lastSeen: row.last_seen,
        memberSince: row.created_at,
      }
    })
  })

export const getDepartmentTeam = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string; currentUserCompanyUserId: string }) => data)
  .handler(
    async ({ data }): Promise<{ members: TeamMember[]; departmentName: string | null }> => {
      const { supabase } = await requireAuthedSupabase()
      const { data: currentUser } = await supabase
        .from('app_company_users')
        .select('department_title_id (department_id)')
        .eq('id', data.currentUserCompanyUserId)
        .maybeSingle()

      const titleData = currentUser?.department_title_id
      const titleObj = Array.isArray(titleData) ? titleData[0] : titleData
      const deptRef = titleObj?.department_id
      const departmentId =
        typeof deptRef === 'string'
          ? deptRef
          : (Array.isArray(deptRef) ? deptRef[0]?.id : deptRef?.id) ?? null

      if (!departmentId) return { members: [], departmentName: null }

      const { data: dept } = await supabase
        .from('app_company_departments')
        .select('name')
        .eq('id', departmentId)
        .maybeSingle()

      const { data: rows, error } = await supabase
        .from('app_company_users')
        .select(
          `
          id,
          created_at,
          last_seen,
          org_user_id (id, first_name, last_name, email, phone, profile_picture_url),
          department_title_id!inner (id, name, department_id)
        `,
        )
        .eq('company_id', data.companyId)
        .eq('department_title_id.department_id', departmentId)
      if (error) throw new Error(error.message)

      const members = (rows ?? [])
        .filter((row) => {
          const title = Array.isArray(row.department_title_id)
            ? row.department_title_id[0]
            : row.department_title_id
          return title !== null
        })
        .map((row) => {
          const orgUser = Array.isArray(row.org_user_id) ? row.org_user_id[0] : row.org_user_id
          const title = Array.isArray(row.department_title_id)
            ? row.department_title_id[0]
            : row.department_title_id
          return {
            id: row.id,
            orgUserId: orgUser?.id ?? '',
            firstName: orgUser?.first_name ?? null,
            lastName: orgUser?.last_name ?? null,
            email: orgUser?.email ?? '',
            phone: orgUser?.phone ?? null,
            profilePictureUrl: orgUser?.profile_picture_url ?? null,
            departmentName: dept?.name ?? null,
            titleName: title?.name ?? null,
            lastSeen: row.last_seen,
            memberSince: row.created_at,
          }
        })

      return { members, departmentName: dept?.name ?? null }
    },
  )
