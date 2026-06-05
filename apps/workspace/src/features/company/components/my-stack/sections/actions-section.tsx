// @ts-nocheck
"use client";

import {
  IconChecklist,
  IconChevronRight,
  IconMessageCirclePlus,
  IconSparkles,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";

/**
 * Actions — a menu of quick creates surfaced as a first-class panel
 * tab. Each row is a full-width button that reads at a glance:
 * icon chip + label + one-line description + chevron. Keeping the
 * pattern consistent with shadcn command-menu rows (and the rest of
 * the app's nav rows) so users recognize them as "click to do".
 *
 * Handlers are stubbed — wire them to real flows (task dialog,
 * compose window, assistant panel) as those surfaces land.
 */
type ActionItem = {
  icon: typeof IconChecklist;
  label: string;
  description: string;
  onClick: () => void;
};

const ACTIONS: ActionItem[] = [
  {
    icon: IconChecklist,
    label: "New task",
    description: "Track work for yourself or a teammate.",
    onClick: () => {},
  },
  {
    icon: IconMessageCirclePlus,
    label: "New message",
    description: "Send a quick note to someone on the team.",
    onClick: () => {},
  },
  {
    icon: IconSparkles,
    label: "Ask assistant",
    description: "Jump into the AI assistant with a fresh prompt.",
    onClick: () => {},
  },
];

export function ActionsSection() {
  return (
    <div className="flex flex-1 flex-col p-2">
      <ul className="flex flex-col gap-0.5">
        {ACTIONS.map(({ icon: Icon, label, description, onClick }) => (
          <li key={label}>
            <button
              type="button"
              onClick={onClick}
              className={cn(
                "group flex w-full items-center gap-3 rounded-md px-2.5 py-2.5 text-left transition-colors",
                "hover:bg-[#f2e9d8] focus-visible:bg-[#f2e9d8] focus-visible:outline-none"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#f2f0eb] text-[#335749] transition-colors group-hover:bg-[#fffdf9]">
                <Icon className="size-4" />
              </span>
              <span className="flex flex-1 flex-col leading-tight">
                <span className="text-sm font-medium text-foreground">
                  {label}
                </span>
                <span className="text-xs text-foreground/55">
                  {description}
                </span>
              </span>
              <IconChevronRight className="size-4 shrink-0 text-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
