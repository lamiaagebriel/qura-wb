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
export const dict: Record<Locale, Dict> = { en: {} as any, fr, ar };
