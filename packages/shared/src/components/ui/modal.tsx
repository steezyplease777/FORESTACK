'use client'

/**
 * shadcn-style dialog built on @radix-ui/react-dialog. Lives alongside the
 * existing react-aria-components `dialog.tsx` (used by a handful of legacy
 * pages) because the shadcn settings-dialog / sidebar-13 pattern expects
 * this API shape - controlled `open` + `DialogContent` slot + unpainted
 * overlay - and re-skinning the react-aria primitive to match would be
 * more invasive than the parallel primitive.
 *
 * Named `modal.tsx` (not `dialog-radix.tsx`) so callers write
 * `import { Modal, ModalContent } from '@/components/ui/modal'` and there
 * is zero chance of accidentally pulling from both primitives in the
 * same file.
 */

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { composeInteractOutside } from '@/components/ui/main-shell-portal'

const Modal = DialogPrimitive.Root
const ModalTrigger = DialogPrimitive.Trigger
const ModalPortal = DialogPrimitive.Portal
const ModalClose = DialogPrimitive.Close

function ModalOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-black/50',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  )
}

/**
 * Centered modal shell. Uses flex centering rather than the traditional
 * translate-50% trick so the content stays pinned to the viewport edge
 * on very tall modals (settings-style layouts with scrollable sidebar)
 * instead of clipping under the top of the screen.
 */
function ModalContent({
  className,
  children,
  showCloseButton = true,
  onInteractOutside,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  // Portal to `document.body` so the `fixed inset-0` centering wrapper
  // covers the FULL viewport — not just the main-shell's box. This is
  // what centers modals on screen even when MyStack is open. The
  // MyStack panel uses a higher z-index than the overlay so it still
  // sits on top (see `my-stack-panel.tsx`), and interaction inside
  // MyStack doesn't dismiss the modal (see `composeInteractOutside`).
  return (
    <ModalPortal>
      <ModalOverlay />
      {/*
       * Centering wrapper spans the viewport MINUS the MyStack panel
       * (via `--my-stack-gutter`, see `styles.css`). When MyStack is
       * closed the gutter is `0px` and we center in the full viewport;
       * when MyStack is open we center in the remaining area so the
       * modal isn't clipped by the panel on the right.
       */}
      <div
        className="fixed inset-y-0 left-0 z-50 flex items-center justify-center p-4"
        style={{ right: "var(--my-stack-gutter, 0px)" }}
      >
        <DialogPrimitive.Content
          // Let users interact with the MyStack panel while a modal is
          // open (drag a file from a future MyStack file tray into a
          // form dropzone, click a notification, etc.) without closing
          // the modal. Radix's default is to close on any outside
          // interaction; we intercept and `preventDefault` when the
          // event originated inside the MyStack panel.
          onInteractOutside={composeInteractOutside(onInteractOutside)}
          className={cn(
            // `max-h-[calc(100dvh-2rem)]` keeps the modal inside the viewport
            // on short screens (mobile landscape, split-view laptops). `dvh`
            // units account for mobile browser chrome resizing. Callers that
            // need a different height should override with `h-*` / `max-h-*`.
            // Use the popover surface (white) so the modal reads as a
            // floating card on the warm Marshmallow canvas. If we used
            // `bg-background` here the modal would blend into the page
            // tint and contained inputs (which are bg-transparent) would
            // pick up the cream cast and look stained.
            'relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            className,
          )}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogPrimitive.Close className="absolute right-3 top-3 z-10 rounded-md p-1 text-muted-foreground opacity-70 ring-offset-background transition-opacity hover:bg-muted hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          ) : null}
        </DialogPrimitive.Content>
      </div>
    </ModalPortal>
  )
}

function ModalTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-base font-semibold leading-none', className)}
      {...props}
    />
  )
}

function ModalDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalClose,
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalDescription,
}
