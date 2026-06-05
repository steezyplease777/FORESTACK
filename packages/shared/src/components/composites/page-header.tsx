// @ts-nocheck
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Small label above the title for context (e.g. module name or section). */
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standard page header used across the portal.
 *
 * Typography follows a calm, single-product-feel hierarchy: a tight
 * semi-bold title, a smaller muted description beneath, and an
 * optional eyebrow for module/section context. Actions sit flush
 * right and stay aligned to the title baseline.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 sm:pt-1">
          {actions}
        </div>
      )}
    </header>
  );
}
