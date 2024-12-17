import dictionary from "@/constants/en";

export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar"],
} as const;

export type Locale = (typeof i18n)["locales"][number];
export type Dictionary = typeof dictionary;
