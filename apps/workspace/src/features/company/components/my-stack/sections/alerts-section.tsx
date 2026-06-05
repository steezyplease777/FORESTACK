// @ts-nocheck

import { IconAlertTriangle } from "@tabler/icons-react";

/**
 * Alerts — operational signals the user should act on (low stock,
 * failed jobs, blocked approvals, etc). Distinct from Inbox because
 * these are actionable, not informational.
 */
export function AlertsSection() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <IconAlertTriangle className="size-5" />
      </div>
      <p className="text-sm font-medium">Nothing urgent</p>
      <p className="text-xs text-muted-foreground">
        Operational alerts and things that need your attention will
        surface here.
      </p>
    </div>
  );
}
