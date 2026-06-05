// @ts-nocheck
import { createServerFn } from '@tanstack/react-start'

import {
  computeRange,
  escapeIlike,
  normalizePagination,
  type PaginatedResult,
} from '@/lib/data/_shared/pagination'
import { requireTenantSupabase } from '@/lib/data/_shared/tenant-supabase'
import {
  EXPENSE_ORDER_COLUMN_BY_SORT,
  isExpenseSortColumn,
} from '@/features/erp/finance/expenses/data/field-map'

import {
  CREDIT_CARD_BANK_LABEL_BY_ID,
  formatCreditCardCatalogTitle,
  orgUserDisplayName,
  type CreditCardCatalogEntry,
} from './credit-card-catalog'
import { EXPENSE_DOCUMENTS_BUCKET } from './document-constants'
import {
  isImageMime,
  resolveExpenseDocumentLocation,
} from './document-paths'
import type {
  CreateExpenseDocumentInput,
  ExpenseCategory,
  ExpenseDocument,
  ExpenseDocumentSignedUrl,
  ExpenseDocumentType,
  ExpenseListParams,
  ExpenseProjectOption,
  ExpenseRecord,
  ExpenseStatus,
  ExpenseTag,
  ExpenseUpdatePatch,
} from './types'

const EXPENSE_DOCUMENT_SELECT =
  'id,name,extension,file_path,type_id,created_at,expense_id,company_id'

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
    const orderColumn = isExpenseSortColumn(sortColumn)
      ? EXPENSE_ORDER_COLUMN_BY_SORT[sortColumn]
      : 'created_at'

    let query = supabase
      .from('erp_expenses')
      .select(EXPENSE_SELECT, { count: 'exact' })
      .eq('company_id', data.companyId)

    if (q) {
      const needle = `%${escapeIlike(q)}%`
      query = query.ilike('title', needle)
    }

    if (data.statusIds?.length) {
      query = query.in('status_id', data.statusIds)
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
      .order(orderColumn, { ascending, nullsFirst: false })
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

const CREDIT_CARD_CATALOG_SELECT =
  'id,card_number,bank,holder:app_company_users!company_user_id(org_user:app_organization_users(first_name,last_name,email))'

export const getCreditCardsCatalog = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<CreditCardCatalogEntry[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('erp_credit_cards')
      .select(CREDIT_CARD_CATALOG_SELECT)
      .eq('company_id', data.companyId)
      .limit(2000)
    if (error) throw new Error(error.message)

    const out: CreditCardCatalogEntry[] = []
    for (const row of rows ?? []) {
      if (!row?.id) continue
      const holder = row.holder
      const holderObj = Array.isArray(holder) ? holder[0] : holder
      const orgUserRaw = holderObj?.org_user
      const orgUser = Array.isArray(orgUserRaw) ? orgUserRaw[0] : orgUserRaw
      const holderName = orgUserDisplayName(orgUser)
      const last4 = String(row.card_number ?? '')
        .replace(/\D/g, '')
        .slice(-4)
      const bank = row.bank ? String(row.bank) : ''
      out.push({
        id: row.id,
        title: formatCreditCardCatalogTitle(holderName, bank, last4),
        last4,
        bankLabel: bank ? CREDIT_CARD_BANK_LABEL_BY_ID[bank] || bank : '',
        holderName: holderName
          ? holderName
              .toLowerCase()
              .replace(/([^\s\-/&(.]+)/g, (w) => w.charAt(0).toUpperCase() + w.slice(1))
          : '',
      })
    }
    return out
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

export type BulkUpdateExpensesResult = {
  updatedCount: number
  requestedCount: number
}

export const bulkUpdateExpensesFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { ids: string[]; patch: ExpenseUpdatePatch }) => data,
  )
  .handler(async ({ data }): Promise<BulkUpdateExpensesResult> => {
    const { supabase } = await requireTenantSupabase()
    const ids = [...new Set(data.ids.filter(Boolean))]
    if (ids.length === 0) {
      return { updatedCount: 0, requestedCount: 0 }
    }

    const { data: rows, error } = await supabase
      .from('erp_expenses')
      .update(data.patch)
      .in('id', ids)
      .select('id')

    if (error) throw new Error(error.message)

    return {
      updatedCount: rows?.length ?? 0,
      requestedCount: ids.length,
    }
  })

export const getExpenseDocumentTypes = createServerFn({ method: 'GET' })
  .inputValidator((data: { companyId: string }) => data)
  .handler(async ({ data }): Promise<ExpenseDocumentType[]> => {
    const { supabase } = await requireTenantSupabase()
    const { data: rows, error } = await supabase
      .from('erp_expense_documents_types')
      .select('id,name,company_id')
      .eq('company_id', data.companyId)
      .order('name')
    if (error) throw new Error(error.message)
    return (rows ?? []) as ExpenseDocumentType[]
  })

export const signExpenseDocumentUrls = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      companyId: string
      items: Array<{
        document: ExpenseDocument
        expenseId: string
      }>
    }) => data,
  )
  .handler(async ({ data }): Promise<ExpenseDocumentSignedUrl[]> => {
    const { supabase } = await requireTenantSupabase()
    const pathsToSign: string[] = []
    const pathByDocId = new Map<string, string>()
    const directByDocId = new Map<string, string>()
    const mimeByDocId = new Map<string, string>()

    for (const item of data.items) {
      const doc = item.document
      if (!doc?.id) continue
      const mime = doc.extension ?? ''
      mimeByDocId.set(doc.id, mime)
      const { storagePath, directUrl } = resolveExpenseDocumentLocation(
        doc,
        data.companyId,
        item.expenseId,
      )
      if (directUrl) {
        directByDocId.set(doc.id, directUrl)
        continue
      }
      if (storagePath) {
        pathsToSign.push(storagePath)
        pathByDocId.set(doc.id, storagePath)
      }
    }

    const signedByPath = new Map<string, string>()
    if (pathsToSign.length > 0) {
      const { data: signed, error } = await supabase.storage
        .from(EXPENSE_DOCUMENTS_BUCKET)
        .createSignedUrls(pathsToSign, 3600)
      if (error) throw new Error(error.message)
      for (const entry of signed ?? []) {
        if (!entry?.path || entry.error) continue
        const url =
          entry.signedUrl ||
          (entry as { signedURL?: string }).signedURL ||
          ''
        if (url) signedByPath.set(String(entry.path).replace(/^\/+/, ''), url)
      }
    }

    const out: ExpenseDocumentSignedUrl[] = []
    for (const item of data.items) {
      const doc = item.document
      if (!doc?.id) continue
      const directUrl = directByDocId.get(doc.id)
      const path = pathByDocId.get(doc.id)
      const url = directUrl || (path ? signedByPath.get(path) || '' : '')
      if (!url) continue
      const mime = mimeByDocId.get(doc.id) ?? ''
      out.push({
        documentId: doc.id,
        url,
        thumb: isImageMime(mime) ? url : undefined,
      })
    }

    return out
  })

export const uploadExpenseDocument = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateExpenseDocumentInput) => data)
  .handler(async ({ data }): Promise<ExpenseDocument> => {
    const { supabase, session } = await requireTenantSupabase()

    const { data: expense, error: expenseError } = await supabase
      .from('erp_expenses')
      .select('id')
      .eq('id', data.expenseId)
      .eq('company_id', data.companyId)
      .maybeSingle()
    if (expenseError) throw new Error(expenseError.message)
    if (!expense) throw new Error('Expense not found')

    const insert: Record<string, unknown> = {
      name: data.name.trim() || 'Document',
      extension: data.mimeType || 'application/octet-stream',
      file_path: data.filePath,
      expense_id: data.expenseId,
      company_id: data.companyId,
      type_id: data.typeId,
    }
    if (session.supabaseUser?.id) {
      insert.created_by = session.supabaseUser.id
    }

    const { data: row, error } = await supabase
      .from('erp_expense_documents')
      .insert(insert)
      .select(EXPENSE_DOCUMENT_SELECT)
      .single()
    if (error) throw new Error(error.message)

    return row as ExpenseDocument
  })
