"use server";

import { hash as Hash, verify as Verify } from "@node-rs/argon2";
import { z } from "zod";

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
	error,
	msg = "an error occured, try again.",
}: {
	error: any;
	msg?: string;
}) {
	console.error(error?.["message"]);
	if (error instanceof z.ZodError) return { error: new ZodError(error) };

	return {
		error: error?.["message"] ?? msg,
	};
}
