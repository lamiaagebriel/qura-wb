"use server";

import {
	productCreateSchema,
	productDeleteSchema,
	productUpdateSchema,
} from "@/validations/products";
import { z } from "zod";

import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { ID } from "@/lib/utils";
import { getDictionary } from "@/lib/locale";

export async function createProduct(data: z.infer<typeof productCreateSchema>) {
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

		const id = ID.generate();
		await db.product.create({
			data: {
				...data,
				id,
			},
		});

		revalidatePath("/", "layout");
		return { id };
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your product was not created. please try again."],
		});
	}
}

export async function updateProduct({ id, ...data }: z.infer<typeof productUpdateSchema>) {
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

		await db.product.update({
			data,
			where: { id },
		});

		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your product was not created. please try again."],
		});
	}
}

export async function deleteProduct({ id }: z.infer<typeof productDeleteSchema>) {
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

		await db.product.delete({
			where: { id },
		});
		revalidatePath("/", "layout");
	} catch (error: any) {
		return handleError({
			locale,
			error,
			message: c?.["your product was not deleted. please try again."],
		});
	}
}
