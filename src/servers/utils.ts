"use server";

import { i18n, t } from "@/lib/locale";
import { Locale } from "@/types/locale";
import { hash as Hash, verify as Verify } from "@node-rs/argon2";
import { headers } from "next/headers";
import { z } from "zod";

export async function getLocale() {
	const refererUrl = (await headers()).get("referer") ?? null;
	let locale: Locale = i18n?.["defaultLocale"];

	if (refererUrl) {
		const url = new URL(refererUrl);
		const pathname = url.pathname;

		const match = pathname.match(/^\/([a-zA-Z-]{2,5})\//);
		if (match) locale = match[1] as Locale;
	}

	return locale;
}
export async function hash(str: string) {
	return Hash(str, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
}

export async function verify(hashed: string, notHashed: string) {
	return Verify(hashed, notHashed, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
}

export async function handleError({
	locale,
	error,
	message,
}: {
	locale: Locale;
	error: any;
	message?: string;
}) {
	console.error(error?.["message"]);
	if (error?.["message"] == "NEXT_REDIRECT") return;

	if (error instanceof z.ZodError)
		return {
			error: await t({ value: new ZodError(error)?.["message"], from: "en", to: locale }),
		};

	if (error?.["message"])
		return {
			error: await t({ value: error?.["message"], from: "en", to: locale }),
		};

	if (message) return { error: message };

	return {
		error: await t({
			value: "An unexpected error occured, please try again later.",
			from: "en",
			to: locale,
		}),
	};
}
