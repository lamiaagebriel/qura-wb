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
