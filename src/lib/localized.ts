// Text a user writes in each app language (a place's name, a business's
// name and about, an address): `{ en, ar }`, at least one filled. Shown in
// the reader's language, otherwise in whichever exists. Client-safe.

import { LOCALES, type Locale } from "@/lib/i18n/config";

export type Localized = Partial<Record<Locale, string>>;

/** The language actually shown for `locale`: it, or the first one written. */
export function shownLocale(text: Localized | null | undefined, locale: Locale): Locale {
  if (text?.[locale]?.trim()) return locale;
  return LOCALES.find((l) => text?.[l]?.trim()) ?? locale;
}

/** The text in `locale`, or in the language it was written in. */
export const inLocale = (text: Localized | null | undefined, locale: Locale) =>
  text?.[shownLocale(text, locale)]?.trim() ?? "";

/** At least one language is filled (the rule every `{ en, ar }` value keeps). */
export const hasText = (text: Localized | null | undefined) =>
  LOCALES.some((l) => !!text?.[l]?.trim());

/** Keeps only the filled languages (what gets stored). */
export function compactLocalized(text: Partial<Record<Locale, string>>): Localized {
  const out: Localized = {};
  for (const l of LOCALES) {
    const value = text[l]?.trim();
    if (value) out[l] = value;
  }
  return out;
}

/** Every language as a form field (`{ en: "", ar: "" }` for the empty ones). */
export const fillLocalized = (text: Localized | null | undefined) =>
  Object.fromEntries(LOCALES.map((l) => [l, text?.[l] ?? ""])) as Record<Locale, string>;
