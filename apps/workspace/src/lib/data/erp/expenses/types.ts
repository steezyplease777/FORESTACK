export type ExpenseStatus = {
  id: string
  name: string
  color: string | null
  company_id: string
}

export type ExpenseVendor = {
  id: string
  name: string
}

export type ExpenseCategory = {
  id: string
  name: string
  internal_code: string | null
}

export type ExpenseTag = {
  id: string
  name: string
  company_id: string
}

export type ExpenseProjectOption = {
  id: string
  name: string
  project_code: string | null
}

export type ExpenseProjectLink = {
  project_id: string
  project: { id: string; name: string; project_code: string | null } | null
}

export type ExpenseDocument = {
  id: string
  name: string
  extension: string | null
  file_path: string | null
  type_id: string | null
  created_at: string
}

/** Raw PostgREST row shape returned by list/detail selects. */
export type ExpenseRecord = {
  id: string
  company_id: string
  title: string | null
  amount: number | null
  paid: number | null
  direction: string | null
  created_at: string
  status_id: string | null
  vendor_id: string | null
  category_id: string | null
  attributes: Record<string, unknown> | null
  tags: string[] | null
  status: ExpenseStatus | null
  vendor: ExpenseVendor | null
  category: ExpenseCategory | null
  expense_projects: ExpenseProjectLink[] | null
  documents: ExpenseDocument[] | null
}

export type ExpenseListParams = {
  companyId: string
  page?: number
  pageSize?: number
  q?: string
  statusId?: string
  categoryIds?: string[]
  projectIds?: string[]
  departmentValues?: string[]
  tagIds?: string[]
  amountMin?: number
  amountMax?: number
  dateFrom?: string
  dateTo?: string
  sortColumn?: 'created_at' | 'title' | 'amount'
  sortDirection?: 'asc' | 'desc'
}

export type ExpenseUpdatePatch = {
  title?: string
  amount?: number | null
  status_id?: string | null
  vendor_id?: string | null
  category_id?: string | null
}
