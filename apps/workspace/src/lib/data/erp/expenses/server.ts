// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'
import { requireTenantSupabase } from '@/lib/data/_shared/tenant-supabase'

import type {
  ExpenseCategory,
  ExpenseListParams,
  ExpenseProjectOption,
  ExpenseRecord,
  ExpenseStatus,
  ExpenseTag,
  ExpenseUpdatePatch,
} from './types'

const EXPENSE_SELECT = `
  id,
  company_id,
  title,
  amount,
  paid,
  direction,
  created_at,
  status_id,
  vendor_id,
  category_id,
  attributes,
  tags,
  status:erp_expense_statuses(id,name,color,company_id),
  vendor:erp_vendors(id,name),
  category:erp_expense_categories(id,name,internal_code),
  expense_projects:erp_expense_projects(
    project_id,
    project:pm_projects(id,name,project_code)
  ),
  documents:erp_expense_documents(id,name,extension,file_path,type_id,created_at)
`

export const getExpenses = createServerFn({ method: 'GET' })
  .inputValidator((data: ExpenseListParams) => data)
  .handler(async ({ data }): Promise<PaginatedResult<ExpenseRecord>> => {
    const { supabase } = await requireTenantSupabase()
    const { page, pageSize, q } = normalizePagination(data)
    const { from, to } = computeRange(page, pageSize)

    const sortColumn = data.sortColumn ?? 'created_at'
    const sortDirection = data.sortDirection ?? 'desc'
    const ascending = sortDirection === 'asc'

    let query = supabase
      .from('erp_expenses')
      .select(EXPENSE_SELECT, { count: 'exact' })
      .eq('company_id', data.companyId)

    if (q) {
      const needle = `%${escapeIlike(q)}%`
      query = query.ilike('title', needle)
    }

    if (data.statusId) {
      query = query.eq('status_id', data.statusId)
    }

    if (data.categoryIds?.length) {
      query = query.in('category_id', data.categoryIds)
    }

    if (data.departmentValues?.length) {
      query = query.in('attributes->>department', data.departmentValues)
    }

    if (data.amountMin != null && Number.isFinite(data.amountMin)) {
      query = query.gte('amount', data.amountMin)
    }

    if (data.amountMax != null && Number.isFinite(data.amountMax)) {
      query = query.lte('amount', data.amountMax)
    }

    if (data.dateFrom) {
      query = query.gte('created_at', `${data.dateFrom}T00:00:00`)
    }

    if (data.dateTo) {
      query = query.lte('created_at', `${data.dateTo}T23:59:59.999`)
    }

    if (data.tagIds?.length) {
      query = query.overlaps('tags', data.tagIds)
    }

    if (data.projectIds?.length) {
      const { data: junctionRows, error: junctionError } = await supabase
        .from('erp_expense_projects')
        .select('expense_id')
        .in('project_id', data.projectIds)
      if (junctionError) throw new Error(junctionError.message)
      const expenseIds = [
        ...new Set(
          (junctionRows ?? [])
            .map((r) => r.expense_id as string)
            .filter(Boolean),
        ),
      ]
      if (expenseIds.length === 0) {
        return { rows: [], total: 0, page, pageSize }
      }
      query = query.in('id', expenseIds)
    }

    const { data: rows, count, error } = await query
      .order(sortColumn, { ascending, nullsFirst: false })
      .range(from, to)

    if (error) throw new Error(error.message)

    return {
      rows: (rows ?? []) as unknown as ExpenseRecord[],
      total: count ?? 0,
      page,
      pageSize,
    }
  })

export const getExpenseStatuses = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<ExpenseStatus[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('erp_expense_statuses')
      .select('id,name,color,company_id')
      .eq('company_id', data.companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (rows ?? []) as ExpenseStatus[]
  })

export const getExpenseCategories = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<ExpenseCategory[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('erp_expense_categories')
      .select('id,name,internal_code')
      .eq('company_id', data.companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (rows ?? []) as ExpenseCategory[]
  })

export const getExpenseTags = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<ExpenseTag[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('erp_expense_tags')
      .select('id,name,company_id')
      .eq('company_id', data.companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (rows ?? []) as ExpenseTag[]
  })

export const getExpenseProjectOptions = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<ExpenseProjectOption[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('pm_projects')
      .select('id,name,project_code')
      .eq('company_id', data.companyId)
      .order('name')
      .limit(500)
    if (error) throw new Error(error.message)
    return (rows ?? []) as ExpenseProjectOption[]
  })

export const getExpenseDepartmentOptions = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<string[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('erp_expenses')
      .select('attributes')
      .eq('company_id', data.companyId)
      .not('attributes->>department', 'is', null)
      .limit(2000)
    if (error) throw new Error(error.message)
    const values = new Set<string>()
    for (const row of rows ?? []) {
      const attrs = row.attributes as Record<string, unknown> | null
      const dept = attrs?.department
      if (typeof dept === 'string' && dept.trim()) values.add(dept.trim())
    }
    return [...values].sort((a, b) => a.localeCompare(b))
  })

export const updateExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { id: string; patch: ExpenseUpdatePatch }) => data,
  )
  .handler(async ({ data }): Promise<ExpenseRecord> => {
    const { supabase } = await requireTenantSupabase()
    const { data: row, error } = await supabase
      .from('erp_expenses')
      .update(data.patch)
      .eq('id', data.id)
      .select(EXPENSE_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return row as unknown as ExpenseRecord
  })
