"use server";

import { storeCreateSchema, storeDeleteSchema, storeUpdateSchema } from "@/validations/stores";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { base64ToBuffer, getMimeType, ID, uploadImages } from "@/lib/utils";
import { getDictionary } from "@/lib/locale";
import { aws } from "@/lib/aws";

export async function createStore({ logo: logoProp, ...data }: z.infer<typeof storeCreateSchema>) {
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

		const logo = logoProp
			? ((
					await uploadImages({
						Key: `products/product-`, // maintain unique naming if needed
						images: [logoProp],
					})
				)?.pop() ?? null)
			: null;

		const id = ID.generate();
		await db.store.create({
			data: {
				...data,
				id,
				userId: user?.["id"],
				logo,
			},
		});

		revalidatePath("/", "layout");
		return { id };
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your store was not created. please try again."],
		});
	}
}

export async function updateStore({
	id,
	logo: logoProp,
	...data
}: z.infer<typeof storeUpdateSchema>) {
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

		const logo = logoProp
			? ((
					await uploadImages({
						Key: `products/product-`, // maintain unique naming if needed
						images: [logoProp],
					})
				)?.pop() ?? null)
			: null;

		await db.store.update({
			data: { ...data, logo },
			where: { id, userId: user?.["id"] },
		});

		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your store was not updated. please try again."],
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

		await db.store.delete({
			where: { id, userId: user?.["id"] },
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
