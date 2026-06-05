import * as React from 'react'

const DEFAULT_HIDE_DELAY_MS = 800

export function useScrollbarReveal(
  ref: React.RefObject<HTMLElement | null>,
  options?: { hideDelayMs?: number },
) {
  const hideDelayMs = options?.hideDelayMs ?? DEFAULT_HIDE_DELAY_MS
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const onScroll = React.useCallback(() => {
    const el = ref.current
    if (!el) return

    el.classList.add('is-scrolling')

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }

    hideTimeoutRef.current = setTimeout(() => {
      el.classList.remove('is-scrolling')
      hideTimeoutRef.current = null
    }, hideDelayMs)
  }, [ref, hideDelayMs])

  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  return { onScroll }
}
