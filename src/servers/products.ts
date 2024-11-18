"use server";

import {
	productCreateSchema,
	productDeleteSchema,
	productUpdateSchema,
} from "@/validations/products";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLocale, handleError } from "@/servers/utils";
import { getDictionary } from "@/lib/locale";
import { getAuth } from "@/lib/lucia";
import { ID } from "@/constants/utils";
import { db } from "@/lib/prisma";
import { uploadImages } from "@/lib/utils";

export async function createProduct({ ...data }: z.infer<typeof productCreateSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary({ locale });

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
				slug: `slug-${id}`,
				title: "Untitled Product",
				price: 0,
				stock: 0,
				attributes: [],
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

export async function updateProduct({
	id,
	images: allImages,
	...data
}: z.infer<typeof productUpdateSchema>) {
	const locale = await getLocale();
	const { actions: c } = await getDictionary({ locale });

	try {
		const { user } = await getAuth();
		if (!user)
			return handleError({
				locale,
				error: null,
				message: c?.["this action needs you to be logged in."],
			});

		const images = await uploadImages({
			Key: `products/product-`, // maintain unique naming if needed
			images: allImages,
		});
		await db.product.update({
			data: { ...data, images },
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
	const { actions: c } = await getDictionary({ locale });

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
