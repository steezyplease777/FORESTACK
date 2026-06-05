// @ts-nocheck

import * as React from 'react'

/** Avoid double-toggle when closing a popover by clicking its trigger in fixed tables. */
export function usePopoverTriggerProtection() {
  const skipNextClickRef = React.useRef(false)

  const triggerProps = {
    'data-popover-trigger': 'true' as const,
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      if (skipNextClickRef.current) {
        skipNextClickRef.current = false
        e.preventDefault()
      }
    },
  }

  const contentProps = {
    onOpenAutoFocus: (e: Event) => e.preventDefault(),
    onPointerDownOutside: (e: { target: EventTarget | null }) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-popover-trigger="true"]')) {
        skipNextClickRef.current = true
      }
    },
  }

  return { triggerProps, contentProps }
}

export function useOptimisticDisplay<T>(value: T) {
  const [optimistic, setOptimistic] = React.useState<{ value: T } | null>(null)
  const prevValueRef = React.useRef<T>(value)

  React.useEffect(() => {
    if (!Object.is(value, prevValueRef.current)) {
      prevValueRef.current = value
      setOptimistic(null)
    }
  }, [value])

  return {
    display: optimistic ? optimistic.value : value,
    apply: (next: T) => setOptimistic({ value: next }),
    revert: () => setOptimistic(null),
  }
}
