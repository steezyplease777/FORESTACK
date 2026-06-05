// @ts-nocheck
"use client";

import * as React from "react";
import {
  IconAlertTriangle,
  IconBell,
  IconBolt,
  IconLayoutSidebarRightCollapse,
  IconSparkles,
} from "@tabler/icons-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import {
  useMyStack,
  type MyStackTab,
} from "@/features/company/components/my-stack/my-stack-provider";
import { ActionsSection } from "@/features/company/components/my-stack/sections/actions-section";
import { AlertsSection } from "@/features/company/components/my-stack/sections/alerts-section";
import { AssistantSection } from "@/features/company/components/my-stack/sections/assistant-section";
import { InboxSection } from "@/features/company/components/my-stack/sections/inbox-section";

type TabConfig = {
  id: MyStackTab;
  label: string;
  icon: typeof IconBell;
};

const TABS: TabConfig[] = [
  { id: "inbox", label: "Inbox", icon: IconBell },
  { id: "alerts", label: "Alerts", icon: IconAlertTriangle },
  { id: "actions", label: "Actions", icon: IconBolt },
  { id: "assistant", label: "Assistant", icon: IconSparkles },
];

const SECTIONS: Record<MyStackTab, React.ComponentType> = {
  inbox: InboxSection,
  alerts: AlertsSection,
  actions: ActionsSection,
  assistant: AssistantSection,
};

/**
 * "My Stack" — the portal-wide personal dashboard. Docked to the right
 * edge, independently toggled from the left navigation sidebar.
 *
 * Modeled on shadcn's `sidebar-09` nested dual-column block, mirrored
 * so the icon rail sits on the OUTER edge (flush against the viewport
 * right) and the content column sits inside, nearer the main page:
 *   ┌───────────────────────────┬────┐
 *   │  <active section header>  │ .  │   icon rail (right) switches
 *   ├───────────────────────────┤ .  │   the active section; the
 *   │                           │ .  │   wider content column (left)
 *   │   <active section body>   │ .  │   owns scroll + section chrome.
 *   │                           │ .  │
 *   └───────────────────────────┴────┘
 *
 * The icon rail matches shadcn's `collapsible="icon"` look (a single
 * column of icon buttons with tooltips). The content column owns the
 * section header (label + close) and a single scroll region. Only the
 * active section mounts, unlike the old tab-list approach that kept
 * all four in the DOM simultaneously.
 *
 * Behavior:
 *   - Desktop (≥md): real docked right sidebar. Participates in the
 *     main flex row (see `portal-shell.tsx`), so when it opens it
 *     reserves `--my-stack-width` of horizontal space. Main content
 *     is NOT relaid out at that new narrower width — `portal-shell`
 *     wraps the `SidebarInset` contents in a `transform: scale()`
 *     zoom container so `@container/main` breakpoints don't retrip.
 *     The panel pins at `top-0` + `h-svh` so it RIDES ABOVE the
 *     tenant header horizontally — the site header only spans the
 *     main-shell's width. That way any sheet opened in the main-shell
 *     (which covers its own tenant header) never covers MyStack.
 *   - Mobile (<md): overlays via a `Sheet`; dual columns still render
 *     inside, since the sheet width already matches `--my-stack-width`.
 */
export function MyStackPanel() {
  const isMobile = useIsMobile();
  const { open, setOpen } = useMyStack();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          showCloseButton={false}
          data-my-stack-safe="true"
          className="w-(--my-stack-width) max-w-[85vw] gap-0 p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>My Stack</SheetTitle>
            <SheetDescription>
              Notifications, alerts, and your assistant.
            </SheetDescription>
          </SheetHeader>
          <PanelBody />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: docked right sidebar, participates in the flex row.
  //
  // Layout is sidebar-like (flush, no floating card) but keeps the
  // warm Forestack brand palette (cream `#fffdf9` + near-black
  // `#191918`), NOT the cool sidebar tokens — the left nav happens
  // to share the same chrome row, but My Stack is its own product
  // surface with its own look.
  //
  // Behavior in the app-shell model (see `portal-shell.tsx`):
  //   - The PortalShell root locks the entire portal to viewport
  //     height. MyStack is a plain flex child inside that row, so
  //     `h-full` already spans the full viewport height — no
  //     `position: sticky` / `h-svh` / `self-start` gymnastics needed.
  //   - `relative z-[60]` creates a local stacking context ABOVE
  //     Radix overlays (which portal to `document.body` at z-50).
  //     This keeps MyStack visually unaffected while a modal is open,
  //     preserving the "interact with MyStack while a modal is open"
  //     UX (e.g. drag-and-drop from MyStack into an open form).
  //
  // Closed state uses `w-0` + `overflow-hidden` so the panel
  // contributes zero width. The inner is pinned to the right edge
  // (`right-0 left-auto` with fixed `w-(--my-stack-width)`) so chrome
  // doesn't reflow mid-animation.
  return (
    <aside
      data-my-stack-safe="true"
      data-state={open ? "open" : "closed"}
      aria-label="My Stack"
      aria-hidden={!open}
      className={cn(
        "relative hidden md:block shrink-0 overflow-hidden",
        "h-full z-[60]",
        "bg-[#fffdf9] text-[#191918]",
        "transition-[width,border-left-width] duration-200 ease-out",
        open
          ? // `pointer-events-auto` is critical when a modal/sheet/drawer
            // is open: Radix's `DismissableLayer` sets
            // `body { pointer-events: none }` in modal mode, and MyStack
            // inherits that. Without this override clicks on MyStack
            // "fall through" to `<html>`, which (a) makes the panel
            // un-interactable and (b) defeats the `onInteractOutside`
            // MyStack-detection (event.target becomes <html>, never an
            // element inside the panel). Explicit `pointer-events: auto`
            // wins the hit test so clicks land on real MyStack children
            // and the sheet stays open.
            "pointer-events-auto w-(--my-stack-width) border-l border-[#191918]/8 "
          : "w-0 pointer-events-none border-l-0"
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          "w-(--my-stack-width) right-0 left-auto "
        )}
      >
        <PanelBody />
      </div>
    </aside>
  );
}

/**
 * Dual-column body — icon rail on the left, section content on the
 * right. Shared by desktop (inside the sticky aside) and mobile
 * (inside the `<Sheet>`).
 */
function PanelBody() {
  const { activeTab } = useMyStack();
  const activeTabConfig = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const ActiveSection = SECTIONS[activeTab];

  // Content column on the LEFT (nearer the main page), icon rail on
  // the RIGHT (flush against the viewport's outer edge). This makes
  // the rail read as part of the window's right chrome — mirroring
  // how the left nav's rail sits against the viewport's left edge —
  // instead of having the rail float in the middle of the page.
  return (
    <div className="flex h-full w-full bg-[#fffdf9] text-[#191918] ">
      <div className="flex min-w-0 flex-1 flex-col">
        <SectionHeader label={activeTabConfig.label} />
        {/*
         * Scroll wrapper has to be a flex column (not a plain block)
         * because every section expects to expand to fill the full
         * panel height — Inbox/Alerts use `flex-1 items-center
         * justify-center` for a vertically centered empty state, and
         * Assistant uses `flex-1 flex-col` so its compose form pins
         * to the bottom while the message list grows above it. A
         * plain `overflow-y-auto` div collapses to content-height
         * and nothing fills.
         *
         * `min-h-0` is required so this flex item can shrink below
         * its intrinsic content size — without it `overflow-y-auto`
         * is defeated (the item just grows to fit its content and
         * the scrollbar never appears, pushing the parent past the
         * sticky aside's capped height).
         */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scale-95">
          <ActiveSection />
        </div>
      </div>
      <TabRail activeTab={activeTab} />
    </div>
  );
}

/**
 * Right-edge icon rail.
 *
 *   - Header cell: explicit "collapse right sidebar" close button.
 *     Sized `h-12` to match SectionHeader so the border-b below
 *     reads as one continuous line across both columns. This is
 *     intentionally a DIFFERENT indicator from the Forestack chip
 *     at the bottom — the chip is a brand/identity lockup (and the
 *     visual landing pad for the closed-state FAB as it docks in),
 *     while the top glyph is an unambiguous panel-collapse control.
 *   - Body: the four section switchers with unread count-dot
 *     overlay, tooltips anchored on the LEFT so they point at the
 *     content column and never off the viewport's right edge.
 *   - Footer dock: empty `h-14` slot that receives the floating
 *     Forestack chip (`<MyStackFab />`) when the panel is open. The
 *     FAB is `position: fixed` — its own open-state styles own the
 *     pixel coordinates (see `my-stack-fab.tsx`); this slot just
 *     reserves vertical space so the last nav icon isn't obscured
 *     by the docked chip.
 */
function TabRail({ activeTab }: { activeTab: MyStackTab }) {
  const { setActiveTab, unreadByTab, setOpen } = useMyStack();

  return (
    <TooltipProvider delayDuration={300} disableHoverableContent>
      <div
        data-slot="my-stack-rail"
        aria-label="My Stack sections"
        className={cn(
          "flex w-10 flex-col items-center ",
          // `border-l` because content column sits on the rail's
          // LEFT side now — the divider belongs between them.
          "border-l border-[#191918]/8 bg-[#fcf9f2]"
        )}
      >
        {/* Header cell — collapse-right-sidebar close control.
            Shares the nav buttons' hover treatment so the rail
            reads as a consistent stack of affordances. */}
        <div className="flex h-12 w-full shrink-0 items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close My Stack"
                className={cn(
                  "flex size-8 items-center justify-center rounded-md",
                  "text-[#191918]/55 transition-colors",
                  "hover:bg-[#f2e9d8] hover:text-[#335749]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#335749]/40"
                )}
              >
                <IconLayoutSidebarRightCollapse className="size-4.5" />
                <span className="sr-only">Close My Stack</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={6}>
              Close
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Section switcher — stacked icon buttons. Tooltips on the
            LEFT side so they don't collide with the content column. */}
        <nav className="flex flex-1 flex-col items-center gap-1 px-1.5 py-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeTab;
            const count = unreadByTab[id] ?? 0;
            return (
              <Tooltip key={id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-active={isActive ? "true" : undefined}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-md",
                      "text-[#191918]/60 transition-colors",
                      "hover:bg-[#f2e9d8] hover:text-[#335749]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#335749]/40",
                      isActive && "bg-[#f2e9d8] text-[#335749]"
                    )}
                  >
                    <Icon className="size-4.5" />
                    {count > 0 && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute right-1 top-1 inline-flex min-w-3.5 items-center justify-center",
                          "rounded-full bg-brand-rose px-1 text-[9px] font-semibold leading-none text-[#191918]",
                          count < 10 ? "h-3.5" : "h-3.5 px-1"
                        )}
                      >
                        {count > 99 ? "99+" : count}
                      </span>
                    )}
                    <span className="sr-only">
                      {count > 0 ? `${label}, ${count} unread` : label}
                    </span>
                  </button>
                </TooltipTrigger>
                {/* Tooltip on the LEFT so it points toward the
                    content column (where the user's eye is going),
                    never off the viewport's right edge. */}
                <TooltipContent side="left" sideOffset={6}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Footer dock — empty slot sized to receive the floating
            <MyStackFab /> chip. The FAB is `position: fixed` at
            `bottom-1 right-1 size-12`, which lands centered inside
            this 56px-wide × 56px-tall area when the panel is open.
            Keeping this cell present (vs. letting `nav flex-1` run
            to the bottom) prevents the last nav icon from being
            obscured by the docked chip. */}
        <div className="h-14 w-full shrink-0" aria-hidden />
      </div>
    </TooltipProvider>
  );
}

/**
 * Content column header — active section label + "My Forestack"
 * eyebrow. Sized `h-12` to match the rail's header spacer so the
 * border-b below reads as a single continuous horizontal line across
 * both columns.
 */
function SectionHeader({ label }: { label: string }) {
  return (
    <header
      className={cn(
        "flex h-12 shrink-0 items-center border-b border-[#191918]/8 px-4 "
      )}
    >
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#191918]/55">
          My Forestack
        </span>
        <span className="text-sm font-semibold text-[#191918]">{label}</span>
      </div>
    </header>
  );
}
