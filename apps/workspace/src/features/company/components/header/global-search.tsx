// @ts-nocheck
"use client";

import { IconSearch } from "@tabler/icons-react";

/**
 * Global search input for portal headers.
 *
 * Visual-only for now — wiring up to a real command palette / search
 * index is a follow-up. Hidden on mobile; each portal header decides
 * how much horizontal room to give it via the wrapping element.
 */
export function GlobalSearch() {
  return (
    <div className="relative w-full">
      <IconSearch className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
      <input
        type="search"
        placeholder="Search or jump to…"
        className="placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 bg-muted/50 focus-visible:bg-background h-8 w-full rounded-md border border-transparent pl-8 pr-12 text-sm outline-hidden transition-colors focus-visible:ring-[3px]"
      />
      <kbd className="bg-background text-muted-foreground pointer-events-none absolute right-1.5 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline-flex">
        ⌘K
      </kbd>
    </div>
  );
}
