// @ts-nocheck

import { IconFilter, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { SalesChannelTab } from "@/lib/data/dashboard/types";

function toTitleCase(str: string) {
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Props = {
  channels: SalesChannelTab[];
  selected: string[];
  onChange: (ids: string[]) => void;
};

export function SalesChannelFilter({
  channels,
  selected,
  onChange,
}: Props) {
  const hasFilter = selected.length > 0;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id]
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <IconFilter className="size-3.5" />
            Sales Channel
            {hasFilter && (
              <Badge
                variant="secondary"
                className="ml-1 rounded-full px-1.5 text-[10px] font-normal"
              >
                {selected.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-0">
          <div className="max-h-48 overflow-y-auto p-1">
            {channels.map((ch) => {
              const isChecked = selected.includes(ch.id);
              return (
                <div
                  key={ch.id}
                  role="option"
                  aria-selected={isChecked}
                  onClick={() => toggle(ch.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(ch.id); } }}
                  tabIndex={0}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <Checkbox checked={isChecked} tabIndex={-1} className="pointer-events-none" />
                  <span className="truncate">{toTitleCase(ch.name)}</span>
                </div>
              );
            })}
            {channels.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No sales channels
              </p>
            )}
          </div>
          {hasFilter && (
            <>
              <Separator />
              <div className="p-1">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="flex w-full items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                >
                  Clear filters
                </button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {hasFilter &&
        selected.map((id) => {
          const ch = channels.find((c) => c.id === id);
          if (!ch) return null;
          return (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 text-xs font-normal"
            >
              {toTitleCase(ch.name)}
              <button
                type="button"
                onClick={() => toggle(id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <IconX className="size-3" />
              </button>
            </Badge>
          );
        })}
    </div>
  );
}
