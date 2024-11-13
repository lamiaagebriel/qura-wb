import { PRODUCT_STATUS_ARR } from "@/constants/enums";
import { z } from "@/lib/zod";
import { attributeSchema } from "@/validations/products/attributes";

export const productSchema = z.object({
	id: z.stringRequired("id"),
	storeId: z.stringRequired("storeId"),
	slug: z.stringRequired("slug").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
		message:
			"it must only contain lowercase english letters, numbers, and hyphens, and cannot start or end with a hyphen.",
	}),
	name: z.stringRequired("name"),
	description: z.string("description").nullable().optional(),
	status: z.enum(PRODUCT_STATUS_ARR),
	images: z.array(z.string("images")).default([]),

	price: z.number("price").min(0, "price can't be below'0."),
	stock: z.number("stock").min(0, "stock can't be below'0."),

	// TODO: use attributesSchema
	attributes: z.array(attributeSchema),
});

export const productCreateSchema = productSchema.pick({
	storeId: true,
});

export const productUpdateSchema = productSchema.pick({
	id: true,
	name: true,
	slug: true,
	description: true,
	status: true,
	price: true,
	stock: true,
	images: true,
	attributes: true,
});

export const productDeleteSchema = productSchema.pick({
	id: true,
});
