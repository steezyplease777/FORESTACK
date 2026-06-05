// @ts-nocheck
"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { AppShell } from "@/components/shells/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { PortalHeader } from "@/features/company/components/header/portal-header";
import { PortalPageHeader } from "@/features/company/components/header/portal-page-header";
import { PageBreadcrumbProvider } from "@/features/company/components/header/page-breadcrumb-context";
import {
  MyStackProvider,
  useMyStack,
} from "@/features/company/components/my-stack/my-stack-provider";
import { MyStackPanel } from "@/features/company/components/my-stack/my-stack-panel";
import { MyStackFab } from "@/features/company/components/my-stack/my-stack-fab";

/**
 * Outer shell for a single portal inside the company app.
 *
 * Composes the shared `AppShell` with workspace-specific My Stack
 * zoom behavior, portal header chrome, and breadcrumb context.
 */
export function PortalShell({
  sidebar,
  children,
  defaultSidebarOpen = true,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  defaultSidebarOpen?: boolean;
}) {
  return (
    <MyStackProvider>
      <PageBreadcrumbProvider>
        <PortalShellInner
          sidebar={sidebar}
          defaultSidebarOpen={defaultSidebarOpen}
        >
          {children}
        </PortalShellInner>
      </PageBreadcrumbProvider>
    </MyStackProvider>
  );
}

const MY_STACK_GAP_PX = 8;

function PortalShellInner({
  sidebar,
  children,
  defaultSidebarOpen,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  defaultSidebarOpen: boolean;
}) {
  const { open: myStackOpen } = useMyStack();
  const mainShellRef = React.useRef<HTMLDivElement>(null);
  const insetScrollRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = React.useState(1);
  const [contentHeight, setContentHeight] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!myStackOpen) {
      setZoom(1);
      return;
    }

    const el = insetScrollRef.current;
    if (!el) return;

    const compute = () => {
      const w = el.getBoundingClientRect().width;
      if (w <= 0) return;
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const myStackPx = 22 * rem;
      const next = w / (w + myStackPx + MY_STACK_GAP_PX);
      setZoom(next);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [myStackOpen]);

  React.useLayoutEffect(() => {
    if (!myStackOpen) {
      setContentHeight(0);
      return;
    }
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setContentHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [myStackOpen]);

  const insetContent = myStackOpen ? (
    <div
      className="relative w-full"
      style={{
        height: contentHeight > 0 ? `${contentHeight * zoom}px` : undefined,
      }}
    >
      <div
        className={cn(
          "absolute top-0 left-0 flex flex-col origin-top-left",
          "transition-[transform,width] duration-200 ease-out",
        )}
        style={{
          transform: `scale(${zoom})`,
          width: `${100 / zoom}%`,
        }}
      >
        <div ref={contentRef} className="@container/main flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </div>
    </div>
  ) : (
    <div className="@container/main flex min-h-0 flex-1 flex-col">{children}</div>
  );

  return (
    <AppShell
      defaultSidebarOpen={defaultSidebarOpen}
      sidebarWidth="12rem"
      rootClassName="[--my-stack-width:22rem]"
      sidebar={sidebar}
      header={<PortalHeader />}
      insetHeader={<PortalPageHeader />}
      insetOverlay={<PortalInsetToaster />}
      mainShellRef={mainShellRef}
      mainShellProps={{
        "data-mystack-open": myStackOpen ? "true" : "false",
      }}
      insetScrollRef={insetScrollRef}
      trailing={<MyStackPanel />}
      after={<MyStackFab />}
    >
      {insetContent}
    </AppShell>
  );
}

/**
 * Toast host scoped to the sidebar-inset column — bottom-center of the
 * main content area, not the full viewport. Overrides sonner's default
 * `position: fixed` so toasts stay right of the left rail and above the
 * content footer (bulk-action bar, table chrome, etc.).
 */
function PortalInsetToaster() {
  return (
    <Toaster
      position="bottom-center"
      richColors
      offset={16}
      className="toaster group !absolute !z-[100] pointer-events-none [&_[data-button]]:pointer-events-auto [&_[data-close-button]]:pointer-events-auto"
    />
  );
}
