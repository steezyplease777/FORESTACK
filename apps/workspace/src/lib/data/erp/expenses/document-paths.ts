import type { ExpenseDocument } from './types'

const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'text/csv': 'csv',
}

export function extensionFromDocumentName(
  name: string,
  mime: string,
): string {
  const dot = name.lastIndexOf('.')
  if (dot >= 0 && dot < name.length - 1) {
    return name.slice(dot + 1).toLowerCase()
  }
  return MIME_TO_EXT[mime] ?? ''
}

/** Resolve the storage path or direct URL for an expense document row. */
export function resolveExpenseDocumentLocation(
  doc: ExpenseDocument,
  companyId: string,
  expenseId: string,
): { storagePath: string | null; directUrl: string | null } {
  const filePath = doc.file_path ?? ''
  const directUrl = /^https?:\/\//i.test(filePath) ? filePath : null
  if (directUrl) {
    return { storagePath: null, directUrl }
  }

  if (filePath && !/^https?:\/\//i.test(filePath)) {
    return { storagePath: filePath.replace(/^\/+/, ''), directUrl: null }
  }

  if (companyId && expenseId && doc.type_id) {
    const ext = extensionFromDocumentName(doc.name, doc.extension ?? '')
    const storagePath = `${companyId}/${expenseId}/${doc.type_id}/${doc.id}${ext ? `.${ext}` : ''}`
    return { storagePath, directUrl: null }
  }

  return { storagePath: null, directUrl: null }
}

export function isImageMime(mime: string): boolean {
  return mime.startsWith('image/')
}
