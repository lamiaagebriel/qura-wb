import { DictionaryObject, DictionaryValue, Locale } from "@/types/locale";
import { match as matchLocale } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { NextRequest } from "next/server";
import tl from "translate";

export const i18n = {
  defaultLocale: "en",
  locales: ["en", "ar", "fr", "de"],
} as const;

// Get the preferred locale, similar to the above or using a library
export function getLocale(req: NextRequest): string | undefined {
  const negotiatorHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

  const locale = matchLocale(languages, i18n.locales, i18n.defaultLocale);
  return locale;
}

export function t(value: string, lang: Locale) {
  return tl(value, { from: "en", to: lang });
}

// -------------- logic for here
export async function translateObject(
  value: DictionaryValue | DictionaryValue[],
  lang: Locale
): Promise<DictionaryValue | DictionaryValue[]> {
  if (typeof value === "boolean") return value; // skip
  if (typeof value === "string") return t(value, lang);

  //  arrays of dictionaries
  if (Array.isArray(value)) {
    const translatedArray: DictionaryValue[] = [];
    for (const item of value)
      translatedArray.push((await translateObject(item, lang)) as any);

    return translatedArray;
  }

  //  objects of dictionaries
  const translatedObject: DictionaryObject = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      // keys to skip
      if (
        [
          "value",
          "icon",
          "segment",
          "href",
          "indicator",
          ...i18n?.["locales"],
        ].includes(key)
      ) {
        translatedObject[key] = value[key];
        continue;
      }

      translatedObject[key] = await translateObject(value[key], lang);
    }
  }
  return translatedObject;
}
