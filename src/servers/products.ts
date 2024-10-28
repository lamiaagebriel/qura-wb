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

export async function createProduct({ ...data }: z.infer<typeof productCreateSchema>) {
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
				name: "Untitled Product",
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

const getImages = async ({ allImages }: { allImages: string[] }) => {
	const imagesWithType = allImages.map((img, index) => ({
		image: img,
		type: img.includes("base64,") ? "base64" : "url",
		index, // store the original position
	}));

	// Process base64 images
	const processedImages = await Promise.all(
		imagesWithType.map(async ({ image, type, index }) => {
			if (type === "base64") {
				const uploadedImage = await aws.upload({
					Key: `products/product-${index}`, // maintain unique naming if needed
					Body: await base64ToBuffer({ base64: image }),
					ContentType: getMimeType({ base64: image }),
				});
				return { image: uploadedImage, index };
			} else {
				return { image, index }; // keep URL images as they are
			}
		}),
	);

	// Reorder based on the original index
	return processedImages
		.sort((a, b) => a.index - b.index) // sort by the original position
		.map(({ image }) => image); // get only the image URLs
};
export async function updateProduct({
	id,
	images: allImages,
	...data
}: z.infer<typeof productUpdateSchema>) {
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

		const images = await getImages({ allImages });
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
