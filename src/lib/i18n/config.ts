// Client-safe locale settings. Adding a language = one entry in `LOCALES`
// + `LOCALE_META`, and a file in `messages/` registered in `server.ts`.

export const LOCALES = ["en", "ar", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "qura__lang";
export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;
// Per-request override for mobile clients; `?lang=` links also use it.
export const LOCALE_HEADER = "x-locale";
export const LOCALE_PARAM = "lang";

export const LOCALE_META: Record<
  Locale,
  { label: string; dir: "ltr" | "rtl"; flag: string }
> = {
  en: { label: "English", dir: "ltr", flag: "gb" },
  ar: { label: "العربية", dir: "rtl", flag: "eg" },
  fr: { label: "Français", dir: "ltr", flag: "fr" },
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
