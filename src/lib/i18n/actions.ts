"use server";

import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  Dict,
  dict,
  LOCALE_META,
  LOCALE_COOKIE,
  LOCALES,
  type Locale,
} from "./config";

export async function setLang(locale: Locale) {
  if (!(LOCALES as readonly string[]).includes(locale)) return;
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function getLang(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return (LOCALES as readonly string[]).includes(value ?? "")
    ? (value as Locale)
    : DEFAULT_LOCALE;
}

export async function getLocale() {
  const locale = await getLang();
  const d = dict[locale];
  const t = (key: keyof Dict) => d[key] ?? key;
  return { t, locale, dir: LOCALE_META[locale].dir };
}
