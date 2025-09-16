import dictionary from "@/constants/en";
import tl from "translate";

export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar"],
} as const;

export async function t(value: string, opts: { from: Locale; to: Locale }) {
  return tl(value, opts);
}

/**
 * Ensures a locale value is always valid, falling back to default if needed
 */
export function ensureValidLocale(locale: string | undefined | null): Locale {
  if (locale && i18n.locales.includes(locale as Locale))
    return locale as Locale;

  return i18n.defaultLocale;
}

export type Locale = (typeof i18n)["locales"][number];
export type Dictionary = typeof dictionary;
