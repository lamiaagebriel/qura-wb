import { z } from "@/lib/zod";

export const pageSchema = z.object({
	url: z.stringRequired("url"),
	title: z.stringRequired("title"),
	description: z.string("description").optional().nullable(),
	body: z.string("body").optional().nullable(),
});

export const pageCreateSchema = z.object({ storeId: z.stringRequired("storeId") }).and(
	pageSchema.pick({
		url: true,
		title: true,
		description: true,
	}),
);

export const pageUpdateSchema = z.object({ storeId: z.stringRequired("storeId") }).and(
	pageSchema.pick({
		url: true,
		title: true,
		description: true,
		body: true,
	}),
);

export const pageDeleteSchema = z.object({ storeId: z.stringRequired("storeId") }).and(
	pageSchema.pick({
		url: true,
	}),
);
