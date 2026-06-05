// @ts-nocheck

import { IconSparkles, IconSend } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

/**
 * Assistant — home for the company-directed chatbot. The real thing
 * will need message history, streaming, tool calls, etc. This stub
 * just shows the conversation shell so the layout is ready.
 */
export function AssistantSection() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="flex size-10 items-center justify-center rounded-full bg-violet-50 text-violet-600 ring-1 ring-violet-100">
          <IconSparkles className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Ask your company assistant</p>
          <p className="text-xs text-muted-foreground">
            Draft messages, look up records, kick off workflows. Coming
            soon.
          </p>
        </div>
      </div>

      <form
        className="flex items-end gap-2 border-t bg-background p-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <textarea
          rows={1}
          disabled
          placeholder="Message your assistant…"
          className="min-h-9 flex-1 resize-none rounded-md border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-hidden disabled:cursor-not-allowed"
        />
        <Button type="submit" size="icon" disabled className="size-9 shrink-0">
          <IconSend className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
