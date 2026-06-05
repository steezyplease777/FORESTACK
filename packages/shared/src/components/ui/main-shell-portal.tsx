"use client";

import * as React from "react";

/**
 * Shared portal target for overlay primitives (Modal / Sheet / Drawer).
 *
 * `PortalShell` wraps `[PortalHeader + sidebar + SidebarInset]` in a single
 * "main-shell" div that is a flex sibling of `<MyStackPanel />`. That wrapper
 * is exposed through this context so that any overlay opened from within
 * the app's content area portals INTO the wrapper instead of into
 * `document.body`.
 *
 * Two consequences fall out of that:
 *
 * 1. The overlay + content are DOM-descendants of a `transform`ed ancestor
 *    (the main-shell always carries `transform: translateZ(0)` at rest and
 *    `transform: scale(var(--zoom))` when MyStack is open). Per the CSS
 *    Transforms spec, any non-`none` `transform` value turns that element
 *    into the containing block for every `position: fixed` descendant, so
 *    `fixed inset-0` overlays get clipped to the main-shell box instead of
 *    the viewport. The MyStack panel sits outside that box and is never
 *    covered by content-area sheets.
 *
 * 2. When MyStack pushes + scales the main-shell, any open sheet scales
 *    WITH it (same transform root), so the visual relationship between the
 *    sheet and the page underneath stays consistent.
 *
 * Callers fall back to `document.body` (Radix's default) when the context
 * isn't present — e.g. when a primitive is used outside `PortalShell`
 * (auth routes, the SaaS portal, Storybook).
 */
const MainShellPortalContext =
  React.createContext<React.RefObject<HTMLElement | null> | null>(null);

export function MainShellPortalProvider({
  containerRef,
  children,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
}) {
  return (
    <MainShellPortalContext.Provider value={containerRef}>
      {children}
    </MainShellPortalContext.Provider>
  );
}

/**
 * Returns the current main-shell element, or `null` if we're outside a
 * `PortalShell` (fall back to Radix's default portal target = `document.body`).
 *
 * Re-subscribes on window resize so the portal target updates once the
 * ref attaches after first paint. `useSyncExternalStore` is overkill here —
 * the consumer only cares about a stable element reference, not reactive
 * mutations.
 */
export function useMainShellPortalContainer(): HTMLElement | null {
  const ref = React.useContext(MainShellPortalContext);
  const [, force] = React.useReducer((n: number) => n + 1, 0);

  React.useEffect(() => {
    if (!ref) return;
    if (ref.current) return;
    // Ref may not be attached on the very first render of an overlay that
    // opens simultaneously with PortalShell mounting. Bump once on next
    // microtask so the portal picks up the element.
    const id = requestAnimationFrame(() => force());
    return () => cancelAnimationFrame(id);
  }, [ref]);

  return ref?.current ?? null;
}

/**
 * CSS selector for any surface that should NOT dismiss an open sheet /
 * modal / drawer when the user interacts with it.
 *
 * Today this tags the MyStack panel (desktop `<aside>` and mobile
 * `<SheetContent>`) plus the MyStack FAB, so users can freely click,
 * scroll, drag from, or close MyStack while a main-shell overlay is
 * open — e.g. drag a future "file tray" item from MyStack into a
 * dropzone inside an open edit dialog without the dialog closing.
 *
 * To add another surface to this allowlist (say, a future global
 * command palette that should also coexist with modals), just set
 * `data-my-stack-safe="true"` on its root element.
 */
export const MY_STACK_SAFE_SELECTOR = '[data-my-stack-safe="true"]';

/**
 * Returns true if the given event's target is inside the MyStack panel.
 *
 * Used by Modal / Sheet / Drawer `Content` components to intercept
 * Radix's `onInteractOutside` / `onPointerDownOutside`. When a user
 * clicks, focuses, or pointer-downs inside MyStack while a sheet is
 * open, Radix defaults to closing the sheet — but we want to let the
 * user freely interact with MyStack (drag files into form dropzones,
 * scroll the assistant, click notifications, etc.) without dismissing
 * whatever they're working on in the main-shell.
 *
 * IMPORTANT — the Radix `InteractOutsideEvent` is a `CustomEvent`
 * dispatched ON the DialogContent element, so `event.target` points
 * at the dialog, not the element the user actually clicked. The real
 * DOM target lives at `event.detail.originalEvent.target` (the
 * native `pointerdown` / `focusin` that triggered the custom event).
 * We check that first, then fall back to `event.target` for non-Radix
 * callers.
 */
export function isEventFromMyStack(
  event: Event | { target?: EventTarget | null; detail?: unknown },
): boolean {
  const detail = (event as { detail?: { originalEvent?: Event } }).detail;
  const originalEvent = detail?.originalEvent;
  const originalTarget = originalEvent?.target;

  if (originalTarget instanceof Element) {
    if (originalTarget.closest(MY_STACK_SAFE_SELECTOR)) return true;
  }
  const target = (event as { target?: EventTarget | null }).target;
  if (target instanceof Element) {
    if (target.closest(MY_STACK_SAFE_SELECTOR)) return true;
  }

  // Radix sets `body { pointer-events: none }` in modal mode, which
  // makes hit testing skip body and land on `<html>` for any click
  // outside the active layer. That destroys `closest(...)` because
  // the real target is no longer inside MyStack. Fall back to
  // coordinate hit-testing against any MyStack-safe element: grab
  // the event's client coordinates and check whether a MyStack-safe
  // element's rect contains that point.
  const pointer = originalEvent as Partial<MouseEvent> | undefined;
  const x = pointer?.clientX;
  const y = pointer?.clientY;
  if (typeof x !== "number" || typeof y !== "number") return false;

  const candidates = document.querySelectorAll<HTMLElement>(
    MY_STACK_SAFE_SELECTOR,
  );
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return true;
    }
  }
  return false;
}

/**
 * Composable `onInteractOutside` handler factory. Produces a handler
 * that calls the caller's own `onInteractOutside` first (if any), then
 * prevents default when the interaction came from inside MyStack.
 *
 * Usage (inside a Radix Dialog.Content / Sheet.Content):
 *
 *   onInteractOutside={composeInteractOutside(props.onInteractOutside)}
 */
export function composeInteractOutside<
  E extends { defaultPrevented: boolean; preventDefault: () => void; target: EventTarget | null },
>(userHandler?: (event: E) => void) {
  return (event: E) => {
    userHandler?.(event);
    if (event.defaultPrevented) return;
    if (isEventFromMyStack(event)) {
      event.preventDefault();
    }
  };
}
