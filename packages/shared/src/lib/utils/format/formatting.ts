import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function formatCurrency(
  value: number | string | null | undefined,
  currency = "USD",
  locale = "en-US",
): string {
  if (value == null || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(num);
}

export function formatDate(
  value: string | Date | null | undefined,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(
    locale,
    options ?? { year: "numeric", month: "short", day: "numeric" },
  );
}

/**
 * Humanises a past timestamp into a short "time ago" string
 * (`just now`, `3m ago`, `2h ago`, `5d ago`) for recent dates, and
 * falls back to a plain calendar date for anything older than a week.
 * Returns an empty string on null/invalid input so callers can render
 * a sensible "Never" placeholder themselves.
 */
export function formatRelativeTime(
  value: string | Date | null | undefined,
  locale = "en-US",
): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  const ms = date.getTime();
  if (Number.isNaN(ms)) return "";

  const diffSeconds = Math.round((Date.now() - ms) / 1000);
  if (diffSeconds < 45) return "just now";
  if (diffSeconds < 60 * 60) return `${Math.round(diffSeconds / 60)}m ago`;
  if (diffSeconds < 60 * 60 * 24) return `${Math.round(diffSeconds / 3600)}h ago`;
  if (diffSeconds < 60 * 60 * 24 * 7)
    return `${Math.round(diffSeconds / 86400)}d ago`;

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
