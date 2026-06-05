import { useEffect } from 'react'

/**
 * Arms the browser's native `beforeunload` prompt while `enabled` is true.
 *
 * Used by save-in-flight flows to block tab-close / refresh / URL change
 * so an in-progress upload never gets severed mid-write. The actual text
 * shown is controlled by the browser (modern browsers ignore any custom
 * string for phishing reasons) — setting `returnValue` is just the
 * trigger. We return early when disabled so the listener is only attached
 * for the short save window, never the lifetime of an open modal.
 */
export function useBeforeUnload(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      // Legacy Chrome requires `returnValue` to also be set.
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enabled])
}
