import { PRODUCT_STATUS_ARR } from "@/constants/enums";
import { z } from "@/lib/zod";

// --------------- ATTRIBUTES
export const attributeSchema = z.object({
	name: z.stringRequired("name"),
	values: z.array(
		z.object({
			name: z.stringRequired("name"),
			description: z.string("description").optional(),
		}),
	),
});

export const attributesSchema = z.object({
	attributes: z.array(attributeSchema).default([]),
});

export const productSchema = z.object({
	id: z.stringRequired("id"),
	storeId: z.stringRequired("storeId"),
	name: z.stringRequired("name"),
	description: z.string("description").nullable().optional(),
	status: z.enum(PRODUCT_STATUS_ARR),
	images: z.array(z.string("images")),

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
