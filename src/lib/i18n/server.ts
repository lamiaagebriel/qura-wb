import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import {
  DEFAULT_LOCALE,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_HEADER,
  LOCALE_META,
  type Locale,
} from "./config";
import { createTranslator } from "./translate";
import type { Messages } from "./types";

// Lazy per-locale imports: a request only loads the language it renders.
const loaders: Record<Locale, () => Promise<Partial<Messages>>> = {
  en: async () => ({}),
  ar: () => import("./messages/ar").then((m) => m.default),
  fr: () => import("./messages/fr").then((m) => m.default),
};

/**
 * Priority: `x-locale` header (sent by mobile clients) → saved cookie (also
 * set from `?lang=` links by `proxy.ts`) → browser language → default.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const headerList = await headers();

  const forced = headerList.get(LOCALE_HEADER);
  if (isLocale(forced)) return forced;

  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;

  const accepted = headerList.get("accept-language") ?? "";
  for (const part of accepted.split(",")) {
    const lang = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (isLocale(lang)) return lang;
  }

  return DEFAULT_LOCALE;
});

export const getMessages = cache((locale: Locale) => loaders[locale]());

/**
 * Everything a Server Component needs:
 *   const { t, locale, dir } = await getTranslations();
 */
export const getTranslations = cache(async () => {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  return {
    t: createTranslator(messages),
    locale,
    dir: LOCALE_META[locale].dir,
    messages,
  };
});

