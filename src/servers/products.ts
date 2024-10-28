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
import { base64ToBuffer, getMimeType, ID } from "@/lib/utils";
import { getDictionary } from "@/lib/locale";
import { aws } from "@/lib/aws";

export async function createProduct({
	images: base64Images,
	...data
}: z.infer<typeof productCreateSchema>) {
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
		const attributes = [
			{
				id: ID.generate(),
				name: "Sizes",
				values: [{ name: "S" }, { name: "M" }, { name: "L" }, { name: "XL" }],
			},
			{
				id: ID.generate(),
				name: "Colors",
				values: [{ name: "Red" }, { name: "Green" }, { name: "Blue" }, { name: "Purple" }],
			},
			{ id: ID.generate(), name: "Materials", values: [{ name: "Cotton" }, { name: "Fiber" }] },
		];

		const images = await Promise.all(
			base64Images?.map(
				async (base64) =>
					await aws.upload({
						Key: "projects/project-",
						Body: await base64ToBuffer({ base64 }),
						ContentType: getMimeType({ base64 }),
					}),
			) ?? [],
		);

		console.log(images);

		await db.product.create({
			data: {
				...data,
				id,
				attributes,
				images,
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
