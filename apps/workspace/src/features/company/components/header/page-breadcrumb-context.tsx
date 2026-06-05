"use client";

import * as React from "react";

/**
 * Lets detail pages register an entity-specific tail crumb
 * (e.g. a campaign name or customer name) into the global
 * `PortalPageHeader` breadcrumb.
 *
 * Why a context instead of parsing the URL?
 *   The tail segment on a detail route is a UUID — there's no way to
 *   derive a human label from it without having loaded the record.
 *   The page already loads the record via TanStack Query, so it's the
 *   authoritative source for the name. Pushing the name up through a
 *   context keeps the header dumb (URL-only inference with one
 *   optional override) and avoids wiring every detail page to its own
 *   breadcrumb component.
 *
 * Contract:
 *   - `usePageBreadcrumb(label)` sets the tail on mount and clears
 *     it on unmount. Re-renders with a different `label` update the
 *     crumb in place (effect depends on `label`).
 *   - Passing `null`/`undefined` is a no-op — useful while the query
 *     is still loading.
 *   - Only one tail crumb is supported at a time; nested detail
 *     routes would be weird anyway.
 */
type PageBreadcrumbContextValue = {
  tail: string | null;
  setTail: (label: string | null) => void;
};

const PageBreadcrumbContext =
  React.createContext<PageBreadcrumbContextValue | null>(null);

export function PageBreadcrumbProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tail, setTail] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ tail, setTail }), [tail]);
  return (
    <PageBreadcrumbContext.Provider value={value}>
      {children}
    </PageBreadcrumbContext.Provider>
  );
}

/** Read hook used by the header — safe to call outside a provider. */
export function usePageBreadcrumbTail(): string | null {
  const ctx = React.useContext(PageBreadcrumbContext);
  return ctx?.tail ?? null;
}

/**
 * Register a tail crumb for the lifetime of the caller.
 * Pass `null`/`undefined` (e.g. during loading) to leave the tail
 * untouched. On unmount the tail is cleared.
 */
export function usePageBreadcrumb(label: string | null | undefined): void {
  const ctx = React.useContext(PageBreadcrumbContext);
  React.useEffect(() => {
    if (!ctx) return;
    if (!label) return;
    ctx.setTail(label);
    return () => ctx.setTail(null);
  }, [ctx, label]);
}
