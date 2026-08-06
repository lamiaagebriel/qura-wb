import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RELATIVE_TIME_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** Threads-style compact relative time ("3h", "2d") rather than
 * `Intl.RelativeTimeFormat`'s verbose "3 hours ago" — this is a label next
 * to a post, not a sentence. */
export function formatCompactRelativeTime(date: Date, locale: string): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return locale.startsWith("ar") ? "الآن" : "now";

  for (const [unit, unitSeconds] of RELATIVE_TIME_UNITS) {
    const value = Math.floor(seconds / unitSeconds);
    if (value >= 1) {
      const suffix = unit === "minute" ? "m" : unit[0];
      return `${value}${suffix}`;
    }
  }
  return locale.startsWith("ar") ? "الآن" : "now";
}
