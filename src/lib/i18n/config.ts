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
// Per-request override sent by mobile clients (never saved). `?lang=` links
// are handled by `proxy.ts`: saved to the cookie, then stripped from the URL.
export const LOCALE_HEADER = "x-locale";
export const LOCALE_PARAM = "lang";

/** Everything per language, in one place. `ogLocale` is the Open Graph
 * locale used on share cards (language_TERRITORY). */
export const LOCALE_META: Record<
  Locale,
  { label: string; dir: "ltr" | "rtl"; flag: string; ogLocale: string }
> = {
  en: { label: "English", dir: "ltr", flag: "gb", ogLocale: "en_US" },
  ar: { label: "العربية", dir: "rtl", flag: "eg", ogLocale: "ar_EG" },
  fr: { label: "Français", dir: "ltr", flag: "fr", ogLocale: "fr_FR" },
};

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}
