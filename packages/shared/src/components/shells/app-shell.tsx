// @ts-nocheck
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MainShellPortalProvider } from "@/components/ui/main-shell-portal";

export type AppShellProps = {
  /** Top chrome row (tenant header, SaaS nav bar, …). */
  header?: React.ReactNode;
  /** Left rail — typically a `<Sidebar>` subtree. */
  sidebar: React.ReactNode;
  /** Sticky sub-header inside the inset (breadcrumbs, page title bar). */
  insetHeader?: React.ReactNode;
  /** Scrollable main content inside the inset. */
  children: React.ReactNode;
  /** Siblings rendered after the main-shell column (e.g. right panels). */
  trailing?: React.ReactNode;
  /** Fixed overlays below the shell row (e.g. FABs). */
  after?: React.ReactNode;
  defaultSidebarOpen?: boolean;
  sidebarWidth?: string;
  rootClassName?: string;
  insetClassName?: string;
  insetScrollClassName?: string;
  insetScrollRef?: React.RefObject<HTMLDivElement | null>;
  mainShellRef?: React.RefObject<HTMLDivElement | null>;
  mainShellClassName?: string;
  mainShellProps?: React.HTMLAttributes<HTMLDivElement>;
};

/**
 * Generic app-shell layout: fixed viewport height, no document scroll,
 * sidebar + inset flex row, local scroll inside the inset.
 *
 * Portal-specific shells (workspace `PortalShell`, studio
 * `WorkspaceShell`) compose this primitive and add their own chrome.
 */
export function AppShell({
  header,
  sidebar,
  insetHeader,
  children,
  trailing,
  after,
  defaultSidebarOpen = true,
  sidebarWidth = "12rem",
  rootClassName,
  insetClassName,
  insetScrollClassName,
  insetScrollRef,
  mainShellRef,
  mainShellClassName,
  mainShellProps,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "[--header-height:calc(--spacing(12))] [--portal-page-header-height:calc(--spacing(12))] flex h-dvh w-full overflow-hidden",
        rootClassName,
      )}
    >
      <SidebarProvider
        className="flex h-full min-h-0 w-full flex-1 overflow-hidden"
        defaultOpen={defaultSidebarOpen}
        style={{ "--sidebar-width": sidebarWidth } as React.CSSProperties}
      >
        <>
          <MainShellPortalProvider containerRef={mainShellRef}>
            <div
              ref={mainShellRef}
              data-slot="main-shell"
              {...mainShellProps}
              className={cn(
                "relative flex min-h-0 min-w-0 flex-1 flex-col",
                mainShellClassName,
                mainShellProps?.className,
              )}
            >
              {header}
              <div className="flex min-h-0 flex-1">
                {sidebar}
                <SidebarInset
                  className={cn(
                    "min-h-0 min-w-0 md:peer-data-[variant=inset]:rounded-[28px]",
                    insetClassName,
                  )}
                >
                  {insetHeader}
                  <div
                    ref={insetScrollRef}
                    data-slot="sidebar-inset-scroll"
                    className={cn(
                      "flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto",
                      insetScrollClassName,
                    )}
                  >
                    {children}
                  </div>
                </SidebarInset>
              </div>
            </div>
          </MainShellPortalProvider>
          {trailing}
          {after}
        </>
      </SidebarProvider>
    </div>
  );
}
