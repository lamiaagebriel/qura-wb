import { z } from "@/lib/zod";

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
	images: z.array(z.string("image")).default([]),

	// TODO: use attributesSchema
	attributes: z.array(attributeSchema).default([]),
});

export const productCreateSchema = productSchema.pick({
	storeId: true,
	name: true,
	images: true,
});

export const productUpdateSchema = productSchema.pick({
	id: true,
	name: true,
	attributes: true,
});

export const productDeleteSchema = productSchema.pick({
	id: true,
});
