// @ts-nocheck

import * as React from 'react'
import {
  IconFile,
  IconPaperclip,
  IconUpload,
} from '@tabler/icons-react'

import { cn } from '@/lib/utils'
import type { ExpenseDocumentPreviewFile } from '@/lib/data/erp/expenses/types'
import { isImageMime } from '@/lib/data/erp/expenses/document-paths'

import { DocumentPreviewDialog } from '../documents/DocumentPreviewDialog'
import type { ExpenseRow } from '../ExpenseAdminTable.types'

const DOCUMENTS_CELL_VISIBLE = 4

type DocumentsCellProps = {
  row: ExpenseRow
  readOnly?: boolean
  uploadEnabled?: boolean
  signedUrlsByDocId?: Map<string, string>
  onDropFile?: (expenseId: string, file: File) => void
}

export function DocumentsCell({
  row,
  readOnly,
  uploadEnabled = false,
  signedUrlsByDocId,
  onDropFile,
}: DocumentsCellProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [dragDepth, setDragDepth] = React.useState(0)
  const [previewIndex, setPreviewIndex] = React.useState<number | null>(null)

  const documents = row.documents
  const visible = documents.slice(0, DOCUMENTS_CELL_VISIBLE)
  const overflow = documents.length - visible.length
  const isDragging = uploadEnabled && dragDepth > 0

  const previewFiles = React.useMemo<ExpenseDocumentPreviewFile[]>(() => {
    return documents
      .map((doc) => {
        const url = signedUrlsByDocId?.get(doc.id) ?? ''
        if (!url) return null
        const mime = doc.extension ?? ''
        return {
          id: doc.id,
          url,
          name: doc.name,
          mime,
          thumb: isImageMime(mime) ? url : undefined,
          docTitle: doc.name,
          createdAt: doc.created_at,
        }
      })
      .filter(Boolean)
  }, [documents, signedUrlsByDocId])

  const previewableIndexByDocId = React.useMemo(() => {
    const map = new Map<string, number>()
    previewFiles.forEach((file, index) => map.set(file.id, index))
    return map
  }, [previewFiles])

  const onDragEnter = (e: React.DragEvent) => {
    if (!uploadEnabled) return
    if (!e.dataTransfer.types?.includes('Files')) return
    e.preventDefault()
    e.stopPropagation()
    setDragDepth((d) => d + 1)
  }

  const onDragOver = (e: React.DragEvent) => {
    if (!uploadEnabled) return
    if (!e.dataTransfer.types?.includes('Files')) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const onDragLeave = (e: React.DragEvent) => {
    if (!uploadEnabled) return
    e.stopPropagation()
    setDragDepth((d) => Math.max(0, d - 1))
  }

  const onDrop = (e: React.DragEvent) => {
    if (!uploadEnabled) return
    e.preventDefault()
    e.stopPropagation()
    setDragDepth(0)
    const file = e.dataTransfer.files?.[0]
    if (file && onDropFile) onDropFile(row.id, file)
  }

  const handlePickFile = (file: File | undefined) => {
    if (!file || !onDropFile) return
    onDropFile(row.id, file)
  }

  const openPreview = (docId: string) => {
    const index = previewableIndexByDocId.get(docId)
    if (index == null) return
    setPreviewIndex(index)
  }

  return (
    <>
      <div
        className={cn(
          'group/doccell relative flex min-h-8 min-w-0 items-center gap-1 rounded px-1 py-0.5 transition-colors',
          isDragging && 'bg-emerald-500/10 outline outline-2 outline-emerald-500/60',
        )}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            handlePickFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        {isDragging ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
            <IconUpload className="size-3" />
            Drop to attach
          </span>
        ) : documents.length === 0 ? (
          uploadEnabled ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
              aria-label="Upload document"
            >
              <IconPaperclip className="size-3.5" />
              <span>Upload</span>
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )
        ) : (
          <>
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground"
              title={`${documents.length} document${documents.length === 1 ? '' : 's'}`}
            >
              <IconPaperclip className="size-3" />
              {documents.length}
            </span>
            {visible.map((doc) => {
              const url = signedUrlsByDocId?.get(doc.id)
              const mime = doc.extension ?? ''
              const isImage = isImageMime(mime)
              const canPreview = previewableIndexByDocId.has(doc.id)

              const tile = (
                <span
                  title={doc.name}
                  className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted/40 text-muted-foreground"
                >
                  {isImage && url ? (
                    <img
                      src={url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <IconFile className="size-3.5" />
                  )}
                </span>
              )

              if (canPreview) {
                return (
                  <button
                    key={doc.id}
                    type="button"
                    className="inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      openPreview(doc.id)
                    }}
                  >
                    {tile}
                  </button>
                )
              }

              return (
                <span key={doc.id} className="inline-flex shrink-0">
                  {tile}
                </span>
              )
            })}
            {overflow > 0 ? (
              <span className="text-[10px] text-muted-foreground">+{overflow}</span>
            ) : null}
          </>
        )}

        {uploadEnabled && documents.length > 0 ? (
          <button
            type="button"
            className="ml-auto inline-flex size-6 shrink-0 items-center justify-center rounded border border-transparent text-muted-foreground opacity-0 transition-opacity hover:border-border hover:bg-muted/50 hover:text-foreground group-hover/doccell:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            aria-label="Upload document"
          >
            <IconUpload className="size-3.5" />
          </button>
        ) : null}
      </div>

      <DocumentPreviewDialog
        open={previewIndex !== null && previewFiles.length > 0}
        files={previewFiles}
        initialIndex={previewIndex ?? 0}
        onClose={() => setPreviewIndex(null)}
      />
    </>
  )
}
