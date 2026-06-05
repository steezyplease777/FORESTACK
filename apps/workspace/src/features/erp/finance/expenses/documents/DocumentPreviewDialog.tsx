// @ts-nocheck

import * as React from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconExternalLink,
  IconFileText,
} from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import type { ExpenseDocumentPreviewFile } from '@/lib/data/erp/expenses/types'

import {
  isImagePreviewFile,
  isPdfPreviewFile,
} from './document-preview-utils'

type DocumentPreviewDialogProps = {
  open: boolean
  files: ExpenseDocumentPreviewFile[]
  initialIndex: number
  onClose: () => void
}

export function DocumentPreviewDialog({
  open,
  files,
  initialIndex,
  onClose,
}: DocumentPreviewDialogProps) {
  const safeFiles = files.length > 0 ? files : []
  const [index, setIndex] = React.useState(
    Math.max(0, Math.min(initialIndex, Math.max(0, safeFiles.length - 1))),
  )

  React.useEffect(() => {
    if (!open) return
    setIndex(Math.max(0, Math.min(initialIndex, Math.max(0, safeFiles.length - 1))))
  }, [open, initialIndex, safeFiles.length])

  const file = safeFiles[index]
  const total = safeFiles.length

  const goPrev = React.useCallback(() => {
    setIndex((i) => (i - 1 + total) % total)
  }, [total])

  const goNext = React.useCallback(() => {
    setIndex((i) => (i + 1) % total)
  }, [total])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (total <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goPrev, goNext, total])

  if (!file) return null

  const mode: 'image' | 'pdf' | 'fallback' = isImagePreviewFile(file)
    ? 'image'
    : isPdfPreviewFile(file)
      ? 'pdf'
      : 'fallback'

  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()}>
      <ModalContent className="flex h-[calc(100dvh-2rem)] max-w-5xl flex-col p-0">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          {total > 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goPrev}
                aria-label="Previous document"
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goNext}
                aria-label="Next document"
              >
                <IconChevronRight className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {index + 1} / {total}
              </span>
            </>
          ) : null}
          <div className="min-w-0 flex-1">
            <ModalTitle className="truncate text-sm">
              {file.docTitle || file.name}
            </ModalTitle>
            {file.createdAt ? (
              <ModalDescription className="text-xs">
                {new Date(file.createdAt).toLocaleString()}
              </ModalDescription>
            ) : null}
          </div>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={file.url} target="_blank" rel="noreferrer noopener">
              <IconExternalLink className="mr-1.5 size-3.5" />
              Open
            </a>
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 items-center justify-center bg-muted/20 p-4">
          {mode === 'image' ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-full max-w-full object-contain"
            />
          ) : mode === 'pdf' ? (
            <iframe
              title={file.name}
              src={`${file.url}#zoom=page-width`}
              className="h-full w-full rounded-md border bg-background"
            />
          ) : (
            <div className="flex max-w-sm flex-col items-center gap-3 text-center">
              <IconFileText className="size-12 text-muted-foreground" />
              <p className="text-sm font-medium">
                {file.docTitle || file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Preview is not available for this file type.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={file.url} target="_blank" rel="noreferrer noopener">
                    <IconExternalLink className="mr-1.5 size-3.5" />
                    Open in new tab
                  </a>
                </Button>
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={file.url} download={file.name}>
                    <IconDownload className="mr-1.5 size-3.5" />
                    Download
                  </a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
