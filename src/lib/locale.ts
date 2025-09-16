import dictionary from "@/constants/en";
import tl from "translate";

export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar"],
} as const;

export async function t(value: string, opts: { from: Locale; to: Locale }) {
  return tl(value, opts);
}

export type Locale = (typeof i18n)["locales"][number];
export type Dictionary = typeof dictionary;
