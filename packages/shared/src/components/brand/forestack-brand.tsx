// @ts-nocheck
import { cn } from "@/lib/utils";

/**
 * Forestack logomark.
 *
 * A 12-petal daisy that mirrors `/applogo.png` (the canonical Forestack
 * logo asset shipped to the auth pages and OG images). Drawn as a vector
 * around 24×24 with `currentColor` so the same mark can render in
 * primary green in the header, on a dark sidebar, or stamped white on
 * brand backgrounds without maintaining a separate asset per surface.
 *
 * Forestack is a sister brand to Fore All — the daisy form factor is
 * intentional shared visual language between the two brands.
 */
export function ForestackMark({
  className,
  ...props
}: React.SVGProps<SVGSVGElement>) {
  // 12 petals, evenly distributed every 30°. Each petal is an
  // elongated rounded rectangle radiating from the center, drawn once
  // and rotated via <use>. Keeping it data-driven (vs. 12 hand-tuned
  // <path>s) makes the mark trivially re-tunable.
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      <defs>
        <rect
          id="forestack-petal"
          x="11.1"
          y="0.6"
          width="1.8"
          height="9.4"
          rx="0.9"
        />
      </defs>
      <g>
        {petals.map((deg) => (
          <use key={deg} href="#forestack-petal" transform={`rotate(${deg} 12 12)`} />
        ))}
      </g>
      <circle cx="12" cy="12" r="1.5" fill="var(--background, #F0EEE4)" />
    </svg>
  );
}

/**
 * Small, composable brand lockup: mark + wordmark "FORESTACK".
 *
 * Used as the product badge in the site header and on auth pages,
 * separate from the tenant company brand (which sits to the right of a
 * divider in `PortalHeader`). Wordmark uses the Fore All voice:
 * uppercase, tight tracking, brand-jet ink.
 */
export function ForestackBrand({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const markSize = size === "sm" ? "size-5" : "size-6";
  const textSize = size === "sm" ? "text-sm" : "text-[15px]";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-brand-hunter",
        className,
      )}
    >
      <ForestackMark className={markSize} />
      <span
        className={cn(
          "font-semibold uppercase tracking-[0.08em] text-brand-jet",
          textSize,
        )}
      >
        Forestack
      </span>
    </span>
  );
}
