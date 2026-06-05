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
  ExpenseListParams,
  ExpenseRecord,
  ExpenseStatus,
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
