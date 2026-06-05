// @ts-nocheck

import { IconBell } from "@tabler/icons-react";

/**
 * Inbox — merges notifications and direct messages into one stream,
 * since the visual/interaction patterns are identical.
 *
 * Placeholder: replace with a real feed hook once the notifications
 * service lands.
 */
export function InboxSection() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <IconBell className="size-5" />
      </div>
      <p className="text-sm font-medium">You're all caught up</p>
      <p className="text-xs text-muted-foreground">
        Notifications and messages will show up here.
      </p>
    </div>
  );
}
