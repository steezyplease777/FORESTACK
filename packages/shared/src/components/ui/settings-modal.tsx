'use client'

/**
 * Reusable "settings-style" modal shell. Current consumer is the
 * company editor (`CompanyEditDialog`); any future admin modal that
 * wants the sidebar + breadcrumb + scrollable-body layout should
 * compose this kit instead of re-inventing the frame. (Account
 * settings used to ship in this shell but now lives as a standalone
 * page at `/:companySlug/account`.)
 *
 * Structure:
 *
 *   <SettingsModal open onOpenChange busy title description>
 *     <SettingsSidebar title icon sections active onChange />
 *     <SettingsPane>
 *       <SettingsHeader leadLabel trail refreshing onClose closeDisabled />
 *       <SettingsBody>...</SettingsBody>
 *     </SettingsPane>
 *   </SettingsModal>
 *
 * `busy` is lifted up to the modal so that long-running saves (e.g. the
 * branding logo upload in the company editor) can lock dismiss paths
 * from a child section without each host re-implementing that dance.
 * When `busy` is true:
 *   - Overlay click / Esc / close button are all no-ops.
 *   - `useBeforeUnload` arms the native "leave site?" prompt for tab
 *     close / refresh / URL change.
 */

import * as React from 'react'
import { ChevronRight, Loader2, X } from 'lucide-react'

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { useBeforeUnload } from '@/lib/hooks/use-before-unload'
import { cn } from '@/lib/utils'

type IconComponent = React.ComponentType<{ className?: string }>

export type SettingsSection<Key extends string = string> = {
  key: Key
  label: string
  icon: IconComponent
}

/**
 * Single breadcrumb segment. `onBack` makes the segment a clickable
 * link back into a parent view; omit it for the trailing leaf label.
 */
export type SettingsBreadcrumb = {
  label: string
  onBack?: () => void
}

/* ---------------------------------------------------------------- Modal */

export function SettingsModal({
  open,
  onOpenChange,
  busy = false,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Lock dismiss paths while a child section is mid-save. */
  busy?: boolean
  /** Accessible title (visually hidden - the breadcrumb is the visual header). */
  title: string
  /** Accessible description (visually hidden). */
  description: string
  children: React.ReactNode
}) {
  useBeforeUnload(busy)

  const handleOpenChange = (next: boolean) => {
    if (busy && !next) return
    onOpenChange(next)
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalContent
        /*
         * Sizing strategy:
         * - `max-w-[900px]` + `w-full` => shrinks on narrow viewports.
         * - `h-[min(560px,calc(100dvh-2rem))]` uses the fixed design
         *   height when the viewport can afford it, caps to the
         *   viewport on short screens. `dvh` reacts to mobile URL-bar
         *   resizing; falls back via the `max-h` in `ModalContent`.
         */
        className="flex h-[min(560px,calc(100dvh-2rem))] max-w-[900px] flex-row overflow-hidden p-0"
        showCloseButton={false}
      >
        {/*
         * Radix requires a title + description for screen readers. The
         * visual header is `<SettingsHeader>`, so these are hidden.
         */}
        <ModalTitle className="sr-only">{title}</ModalTitle>
        <ModalDescription className="sr-only">{description}</ModalDescription>
        {children}
      </ModalContent>
    </Modal>
  )
}

/* -------------------------------------------------------------- Sidebar */

export function SettingsSidebar<Key extends string>({
  title,
  icon: TitleIcon,
  sections,
  active,
  onChange,
}: {
  title: string
  icon: IconComponent
  sections: ReadonlyArray<SettingsSection<Key>>
  active: Key
  onChange: (key: Key) => void
}) {
  return (
    /*
     * Collapses to icons-only below `sm` so the content pane keeps
     * ~75% of the modal width on narrow viewports. The nav buttons
     * stay keyboard-accessible via `aria-label` when text is hidden.
     */
    <aside className="flex w-[56px] shrink-0 flex-col border-r border-border bg-muted/40 sm:w-[220px]">
      <div className="flex h-12 items-center gap-2 border-b border-border px-3 text-sm font-semibold text-foreground sm:px-4">
        <TitleIcon className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{title}</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {sections.map((s) => {
          const Icon = s.icon
          const isActive = active === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onChange(s.key)}
              aria-label={s.label}
              title={s.label}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                'justify-center sm:justify-start',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

/* ------------------------------------------------------- Pane + Header */

export function SettingsPane({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col">{children}</div>
}

export function SettingsHeader({
  leadLabel,
  trail,
  refreshing = false,
  onClose,
  closeDisabled = false,
}: {
  /** Muted breadcrumb root (e.g. tenant name). Truncated on overflow. */
  leadLabel: string
  /**
   * Breadcrumb trail past the root. Each item renders a `ChevronRight`
   * separator; items with `onBack` become buttons, the final item is a
   * non-interactive leaf rendered in the emphasis color.
   */
  trail: ReadonlyArray<SettingsBreadcrumb>
  /** Subtle spinner next to the breadcrumb while a background refetch runs. */
  refreshing?: boolean
  onClose: () => void
  closeDisabled?: boolean
}) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        {/*
         * `truncate` on the root prevents a long tenant name from
         * pushing the active section + close button off the right
         * edge on narrow modals.
         */}
        <span className="truncate text-muted-foreground">{leadLabel}</span>
        {trail.map((segment, i) => {
          const isLast = i === trail.length - 1
          return (
            <React.Fragment key={`${segment.label}-${i}`}>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              {segment.onBack && !isLast ? (
                <button
                  type="button"
                  onClick={segment.onBack}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  {segment.label}
                </button>
              ) : (
                <span
                  className={cn(
                    'font-medium text-foreground',
                    /*
                     * Final leaf labels can be user data (e.g. a
                     * department name), so allow truncation. The
                     * canonical "section name" leaf is short enough
                     * that `shrink-0` is a safe default.
                     */
                    isLast && segment.onBack ? 'truncate' : 'shrink-0',
                  )}
                >
                  {segment.label}
                </span>
              )}
            </React.Fragment>
          )
        })}
        {/*
         * Subtle "refreshing" indicator during a TanStack Query
         * background refetch. Data stays visible
         * (stale-while-revalidate); a tiny spinner says "new data
         * coming" without blocking interaction.
         */}
        {refreshing ? (
          <Loader2 className="ml-2 h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  )
}

/* ------------------------------------------------------------------ Body */

export function SettingsBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'min-h-0 min-w-full flex-1 overflow-y-auto px-2 sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

/* -------------------------------------------------------- Section header */

export function SettingsSectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h5 className="text-md font-semibold text-foreground">{title}</h5>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
