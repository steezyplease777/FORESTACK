// @ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useMyStack } from "@/features/company/components/my-stack/my-stack-provider";

/**
 * Dual-role Forestack chip — floating launcher AND in-rail close
 * toggle. Always rendered at `fixed bottom-1 right-1` so it occupies
 * the same viewport coordinates regardless of panel state:
 *
 *   - Closed: sits free-floating against the portal's page bg at the
 *     bottom-right corner. It's the sole entry point into My Stack.
 *   - Open:  the same pixel position lands perfectly centered inside
 *     the My Stack rail's bottom slot (rail is 56px wide, chip is
 *     48px, 4px padding each side). Visually the chip "docks" into
 *     the sidebar as the panel slides out from the right — no
 *     motion of the chip itself, the sidebar just wraps around it.
 *     Clicking it then closes the panel.
 *
 * Styled to match the section-rail's brand treatment (cream
 * `#f2e9d8` ground, `#335749` green logo, `rounded-md`) so the
 * "floating chip" and the "sidebar logo" read as the same element.
 *
 * Layout coexistence:
 *   - The TanStack devtools button sits at `bottom-left` (see
 *     `routes/__root.tsx`), so both indicators have their own corner.
 *   - Mounted inside `PortalShell` so it only renders on authenticated
 *     portal routes, not on login/splash screens.
 */
export function MyStackFab() {
  const { open, toggle, unreadTotal } = useMyStack();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={open ? "Close My Stack" : "Open My Stack"}
            aria-pressed={open}
            // See `main-shell-portal.tsx` - lets the user toggle MyStack
            // while a modal/sheet/drawer is open without dismissing it.
            data-my-stack-safe="true"
            className={cn(
              // Radix's modal mode sets `body { pointer-events: none }`,
              // which cascades to this fixed-position button. Explicitly
              // re-enable pointer events so the FAB remains clickable
              // while a modal/sheet/drawer is open.
              "pointer-events-auto",
              // `bottom-3 right-3` lands the size-16 chip inside
              // (and just slightly past) the 56px rail's bottom slot
              // so it reads as the sidebar's bottom-right logo when
              // docked, and as a free-floating chip otherwise.
              "fixed bottom-6 right-6 z-[70]",
              "size-14 rounded-full border border-foreground/8 bg-transparent backdrop-blur-xs",
              
              // Shadow reads as "floating" when closed; we flatten
              // it in the pressed/open state below so the chip sits
              // "into" the rail instead of hovering over it.
              "shadow-[0_8px_24px_-12px_rgb(25_25_24_/_0.28)]",
              "hover:bg-[#e9dec9] hover:text-[#335749]",
              // Animate bg / border / shadow alongside the press
              // scale so the closed→open "dock" transition reads
              // as one smooth morph.
              "transition-[transform,background-color,border-color,box-shadow,color, size, bottom, right, rounded] duration-150 ease-out",
              "hover:scale-[1.04] active:scale-95 ",
              // Pressed / docked-into-sidebar look — inverted palette
              // (deep green ground, cream logo) with no drop shadow,
              // so it feels recessed into the rail rather than
              // floating above it.
              open && [
                "fixed bottom-2 right-1 z-[70]",
                "size-8 border-none rounded-xl",
                "shadow-none",
                "bg-[transparent] text-[#335749] backdrop-blur-none",
                "transition-[transform,background-color,border-color,box-shadow,color, size, bottom, right,rounded] duration-150 ease-in",
                "hover:bg-[#e9dec9] hover:text-[#335749] hover:right-1",
              ]
            )}
          >
            <img
              src="/forestack_logo.svg"
              alt=""
              aria-hidden
              className="size-8 object-cover "
              draggable={false}
            />
            {unreadTotal > 0 && (
              <span
                aria-hidden
                // Ring color follows the chip's current ground
                // (cream when closed, deep green when open) so the
                // dot always reads as separated from the chip body.
                className={cn(
                  "absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-[#f7caca] ring-2",
                  open ? "ring-[#335749]" : "ring-[#f2e9d8]"
                )}
              />
            )}
            <span className="sr-only">
              {unreadTotal > 0 ? `My Stack, ${unreadTotal} unread` : "My Stack"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          {open ? "Close My Stack" : "My Stack"}
          <kbd className="ml-2 rounded border bg-background/60 px-1 py-0.5 font-mono text-[8px]">
            ⌘J
          </kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
