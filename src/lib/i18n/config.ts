import { ar } from "./_ar";
import { fr } from "./_fr";

export const LOCALES = ["fr", "en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "qura__lang";

export const LOCALE_META: Record<
  Locale,
  { label: string; dir: "ltr" | "rtl"; lang: string; flag: string }
> = {
  en: { label: "English", dir: "ltr", lang: "en", flag: "gb" }, // Great Britain
  fr: { label: "Français", dir: "ltr", lang: "fr", flag: "fr" }, // France
  ar: { label: "العربية", dir: "rtl", lang: "ar", flag: "eg" }, // Egypt
};
export type Dict = typeof ar;
// English has no translation table of its own — `t()` (`i18n/actions.ts`,
// `i18n/client.tsx`) falls back to the lookup key itself when a dict entry
// is missing, and every key *is* the English string, so an empty object is
// the correct "identity" dictionary. `Dict`'s keys aren't optional, so it
// still needs a cast — routed through `unknown` rather than `any` to keep
// the `no-explicit-any` lint rule happy without changing behavior.
export const dict: Record<Locale, Dict> = { en: {} as unknown as Dict, fr, ar };

function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Same job as `getLang()` in `i18n/actions.ts`, but for code that only has
 * a raw `Request` (or its `cookie` header) to work with instead of
 * `next/headers`'s `cookies()` — namely Better Auth's email callbacks
 * (`lib/auth/auth.ts`), which only ever hand us a Fetch API `Request`.
 */
export function getLocaleFromCookieHeader(
  cookieHeader: string | null | undefined,
): Locale {
  if (!cookieHeader) return DEFAULT_LOCALE;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey === LOCALE_COOKIE) {
      const value = decodeURIComponent(rawValue.join("="));
      return isLocale(value) ? value : DEFAULT_LOCALE;
    }
  }

  return DEFAULT_LOCALE;
}
