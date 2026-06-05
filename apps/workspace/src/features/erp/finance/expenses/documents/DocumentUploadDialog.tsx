// @ts-nocheck

import * as React from 'react'
import { IconLoader2, IconUpload } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import type { ExpenseDocumentType } from '@/lib/data/erp/expenses/types'

import { formatDocumentFileSize } from './document-preview-utils'

type DocumentUploadDialogProps = {
  open: boolean
  expenseId: string
  companyId: string
  file: File | null
  documentTypes: ExpenseDocumentType[]
  isSubmitting?: boolean
  onClose: () => void
  onSubmit: (input: {
    expenseId: string
    companyId: string
    name: string
    typeId: string
    file: File
  }) => Promise<void>
}

export function DocumentUploadDialog({
  open,
  expenseId,
  companyId,
  file,
  documentTypes,
  isSubmitting = false,
  onClose,
  onSubmit,
}: DocumentUploadDialogProps) {
  const defaultTitle = React.useMemo(() => {
    if (!file) return ''
    const dot = file.name.lastIndexOf('.')
    return dot > 0 ? file.name.slice(0, dot) : file.name
  }, [file?.name])

  const [title, setTitle] = React.useState(defaultTitle)
  const [docTypeId, setDocTypeId] = React.useState(documentTypes[0]?.id ?? '')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setTitle(defaultTitle)
    setDocTypeId(documentTypes[0]?.id ?? '')
    setError(null)
  }, [open, defaultTitle, documentTypes])

  const noTypes = documentTypes.length === 0
  const canSubmit =
    !!file &&
    !isSubmitting &&
    !noTypes &&
    title.trim().length > 0 &&
    !!docTypeId

  const handleSubmit = async () => {
    if (!canSubmit || !file) return
    setError(null)
    try {
      await onSubmit({
        expenseId,
        companyId,
        name: title.trim(),
        typeId: docTypeId,
        file,
      })
      toast.success('Document uploaded.')
      onClose()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to upload document.'
      setError(message)
      toast.error(message)
    }
  }

  return (
    <Modal
      open={open && !!file}
      onOpenChange={(next) => {
        if (!next && !isSubmitting) onClose()
      }}
    >
      <ModalContent className="max-w-md">
        <div className="space-y-1 p-6 pb-0">
          <ModalTitle>Upload document</ModalTitle>
          <ModalDescription>
            Name the file and choose a document type before saving.
          </ModalDescription>
        </div>

        <div className="space-y-4 p-6 pt-4">
          {file ? (
            <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDocumentFileSize(file.size)}
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="expense-doc-title">Title</Label>
            <Input
              id="expense-doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-doc-type">Document type</Label>
            <select
              id="expense-doc-type"
              value={docTypeId}
              onChange={(e) => setDocTypeId(e.target.value)}
              disabled={isSubmitting || noTypes}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {noTypes ? (
                <option value="">No document types configured</option>
              ) : null}
              {documentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t bg-muted/20 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <IconLoader2 className="mr-2 size-3.5 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <IconUpload className="mr-2 size-3.5" />
                Upload
              </>
            )}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  )
}
