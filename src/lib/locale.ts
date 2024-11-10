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
export function getLocale(req: NextRequest) {
	const negotiatorHeaders: Record<string, string> = {};
	req.headers.forEach((value, key) => (negotiatorHeaders[key] = value));
	const languages = new Negotiator({ headers: negotiatorHeaders }).languages();

	const locale = matchLocale(languages, i18n.locales, i18n.defaultLocale);
	return locale as Locale;
}

export async function t({ value, ...opts }: { value: string; from: Locale; to: Locale }) {
	return tl(value, opts);
}

export async function translateObject({
	value,
	from,
	to,
}: {
	value: DictionaryValue | DictionaryValue[];
	from: Locale;
	to: Locale;
}): Promise<DictionaryValue | DictionaryValue[]> {
	if (Array.isArray(value)) {
		const translatedArray: DictionaryValue[] = [];
		for (const item of value)
			translatedArray.push((await translateObject({ value: item, from, to })) as any);

		return translatedArray;
	}

	if (typeof value === "object") {
		//  objects of dictionaries
		const translatedObject: DictionaryObject = {};
		for (const key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				// keys to skip
				if (
					["value", "icon", "segments", "href", "indicator", ...i18n?.["locales"]].includes(key)
				) {
					translatedObject[key] = value[key];
					continue;
				}

				translatedObject[key] = await translateObject({
					value: value[key],
					from,
					to,
				});
			}
		}
		return translatedObject;
	}

	if (typeof value === "string") return t({ value, from, to });

	return value; // skip
}

const site = {
	ar: () => import("@/constants/ar").then((module) => module?.["default"]),
	en: () => import("@/constants/en").then((module) => module?.["default"]),
};

export const getDictionary = async ({ locale }: { locale: Locale }) => {
	if (
		// locale === "ar" ||
		locale === "en"
	)
		return await site[locale]();

	const dic = await site["en"]();
	return (await translateObject({
		value: dic as any,
		from: "en",
		to: locale,
	})) as unknown as typeof dic;
};
