"use server";

import { storeCreateSchema, storeDeleteSchema, storeUpdateSchema } from "@/validations/stores";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { ID } from "@/lib/utils";
import { getDictionary } from "@/lib/locale";

export async function createStore(data: z.infer<typeof storeCreateSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary(locale);

	try {
		const { user } = await getAuth();
		if (!user)
			return handleError({
				locale,
				error: null,
				message: c?.["this action needs you to be logged in."],
			});

		const s = await db.store.create({
			data: {
				...data,
				id: ID.generate(),
				userId: user?.["id"],
			},
		});

		revalidatePath("/", "layout");
		return { id: s?.["id"] };
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your store was not created. please try again."],
		});
	}
}

export async function updateStore({ id, ...data }: z.infer<typeof storeUpdateSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary(locale);

	try {
		const { user } = await getAuth();
		if (!user)
			return handleError({
				locale,
				error: null,
				message: c?.["this action needs you to be logged in."],
			});

		await db.store.update({
			data,
			where: { id, userId: user?.["id"] },
		});

		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your store was not created. please try again."],
		});
	}
}

export async function deleteStore({ id }: z.infer<typeof storeDeleteSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary(locale);

	try {
		const { user } = await getAuth();
		if (!user)
			return handleError({
				locale,
				error: null,
				message: c?.["this action needs you to be logged in."],
			});

		console.log({ id, userId: user?.["id"] });
		await db.store.delete({
			where: { id: id ?? "", userId: user?.["id"] },
		});
		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your store was not deleted. please try again."],
		});
	}
}
