import type { ExpenseDocumentPreviewFile } from '@/lib/data/erp/expenses/types'

export function isImagePreviewFile(file: ExpenseDocumentPreviewFile): boolean {
  const mime = file.mime.toLowerCase()
  if (mime.startsWith('image/')) return true
  const name = file.name.toLowerCase()
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)
}

export function isPdfPreviewFile(file: ExpenseDocumentPreviewFile): boolean {
  const mime = file.mime.toLowerCase()
  if (mime === 'application/pdf' || mime.includes('pdf')) return true
  return file.name.toLowerCase().endsWith('.pdf')
}

export function formatDocumentFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
