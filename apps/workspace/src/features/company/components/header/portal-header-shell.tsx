// @ts-nocheck
"use client";

import * as React from "react";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Outer frame shared by every portal's header.
 *
 * Each portal composes its own content inside this shell — brand,
 * search, actions, user menu, etc. — but the shared chrome (height,
 * blur, border) lives here so all 6 portals read as one product even
 * though their insides differ.
 *
 * In the app-shell model (see `portal-shell.tsx`) the header is just
 * a `shrink-0` flex child at the top of `main-shell`. It doesn't need
 * `position: sticky` because the document itself never scrolls — the
 * header is always at the top by virtue of being the first row in a
 * fixed-height flex column.
 *
 * The mobile sidebar trigger is included by default; set
 * `showMobileSidebarTrigger={false}` in portals that don't render a
 * toggle-able sidebar.
 */
export function PortalHeaderShell({
  children,
  className,
  showMobileSidebarTrigger = true,
}: {
  children: React.ReactNode;
  className?: string;
  showMobileSidebarTrigger?: boolean;
}) {
  return (
    <header
      className={cn(
        "bg-background/95 supports-[backdrop-filter]:bg-background/75 relative z-50 flex h-(--header-height) w-full shrink-0 items-center border-b backdrop-blur",
        className
      )}
    >
      <div className="flex h-full w-full items-center gap-2 px-3 md:px-4">
        {showMobileSidebarTrigger ? (
          <SidebarTrigger className="-ml-1 md:hidden" />
        ) : null}
        {children}
      </div>
    </header>
  );
}
