import { cookies as nextCookies } from "next/headers";

import dictionary from "@/constants/en";

const site = {
  ar: () => import("@/constants/ar").then((module) => module?.["default"]),
  en: () => import("@/constants/en").then((module) => module?.["default"]),
};

export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar"],
} as const;

export const getDictionary = async () => {
  // Note: here I assume that middleware always makes sure that locale is in cookies.
  const cookies = await nextCookies();
  const locale = cookies.get("locale")?.["value"] as Locale;

  const dic = await site[locale]();
  return { locale, ...dic };
};

export type Locale = (typeof i18n)["locales"][number];
export type Dictionary = typeof dictionary;
