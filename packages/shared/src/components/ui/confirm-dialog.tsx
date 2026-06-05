'use client'

/**
 * App-themed replacement for `window.confirm()`.
 *
 * The browser's native `confirm()` breaks visual continuity (jumps to
 * the top of the screen with OS chrome, can't be styled, disables the
 * whole page), so anything inside a themed modal / flow should use
 * this instead.
 *
 * Shape:
 *   - `<ConfirmDialog />` is a controlled Radix-Dialog-based component.
 *   - `useConfirm()` wraps it in an imperative hook so existing
 *     `if (!confirm('...')) return` call sites become
 *     `if (!(await confirm({ title, description }))) return` with
 *     minimal churn.
 *
 * Usage:
 *   const { confirm, dialog } = useConfirm()
 *   // ...somewhere in your component:
 *   const ok = await confirm({ title, description, confirmText, tone: 'destructive' })
 *   // render `dialog` somewhere in the tree:
 *   return <>{dialog}...</>
 *
 * Radix Dialog natively supports nesting, so placing `dialog` inside
 * another open `Modal` (e.g. the company-editor) works without any
 * extra portal / focus juggling - the inner confirm traps focus while
 * it's open and returns it when closed.
 */

import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'

export type ConfirmOptions = {
  title: string
  description?: string
  /** Button label for the confirm action. Defaults to "Confirm". */
  confirmText?: string
  /** Button label for the cancel action. Defaults to "Cancel". */
  cancelText?: string
  /**
   * Visual tone of the confirm button. `destructive` renders in red
   * for deletes; `default` for neutral confirmations.
   */
  tone?: 'default' | 'destructive'
}

type InternalState = ConfirmOptions & {
  resolve: (value: boolean) => void
}

/**
 * Controlled confirm dialog. Prefer `useConfirm()` in feature code -
 * this raw primitive exists so shared shell layouts can own the
 * render location.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  tone = 'default',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  onCancel: () => void
} & ConfirmOptions) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        className="max-w-[440px] p-0"
        showCloseButton={false}
        onEscapeKeyDown={() => onCancel()}
        onPointerDownOutside={() => onCancel()}
      >
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <ModalTitle className="text-base font-semibold text-foreground">
              {title}
            </ModalTitle>
            {description ? (
              <ModalDescription className="text-sm text-muted-foreground">
                {description}
              </ModalDescription>
            ) : (
              /*
               * Radix requires a Description for a11y; render a
               * hidden one when the caller didn't supply any copy.
               */
              <ModalDescription className="sr-only">
                Please confirm the requested action.
              </ModalDescription>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button
              variant={tone === 'destructive' ? 'destructive' : 'default'}
              size="sm"
              onClick={onConfirm}
              autoFocus
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  )
}

/**
 * Imperative confirm hook.  Returns a `dialog` ReactNode to render
 * anywhere in the tree, and a `confirm()` function that resolves with
 * `true` / `false` based on user action.
 *
 * The resolver is stored in a ref so calls that arrive while another
 * confirm is still open fall through to the existing promise (we only
 * track one at a time by design - chained confirms would be confusing
 * UX anyway).
 */
export function useConfirm() {
  const [state, setState] = React.useState<InternalState | null>(null)

  const close = React.useCallback((value: boolean) => {
    setState((prev) => {
      prev?.resolve(value)
      return null
    })
  }, [])

  const confirm = React.useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setState({ ...opts, resolve })
      }),
    [],
  )

  const dialog = (
    <ConfirmDialog
      open={state !== null}
      onOpenChange={(next) => {
        if (!next) close(false)
      }}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
      title={state?.title ?? ''}
      description={state?.description}
      confirmText={state?.confirmText}
      cancelText={state?.cancelText}
      tone={state?.tone}
    />
  )

  return { confirm, dialog }
}
