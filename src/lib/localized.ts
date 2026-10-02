// Text a user writes in several languages (a business's name, bio,
// addresses). English is required and is the fallback for any language
// left out. Client-safe.

import type { Locale } from "@/lib/i18n/config";

export type Localized = { en: string } & Partial<
  Record<Exclude<Locale, "en">, string>
>;

/** The text in `locale`, or English when it wasn't written in it. */
export const inLocale = (text: Localized, locale: Locale) =>
  text[locale] || text.en;
