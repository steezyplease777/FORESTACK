import { createClient } from '@/lib/datasource/supabase/client'

import { EXPENSE_DOCUMENTS_BUCKET } from './document-constants'

/**
 * Upload a file to the private `erp-expense-documents` bucket.
 * Returns the storage object path stored in `erp_expense_documents.file_path`.
 */
export async function uploadExpenseDocumentFile(file: File): Promise<string> {
  const supabase = createClient()
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `uploads/${Date.now()}-${safe}`
  const { data, error } = await supabase.storage
    .from(EXPENSE_DOCUMENTS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return data?.path ?? path
}
