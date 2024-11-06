import { z } from "@/lib/zod";

export const storeSchema = z.object({
	id: z.stringRequired("id"),
	userId: z.stringRequired("userId"),
	name: z.stringRequired("name"),
	logo: z.string("logo").nullable().optional(),
});

export const storeCreateSchema = storeSchema.pick({
	name: true,
	logo: true,
});

export const storeUpdateSchema = storeSchema.pick({
	id: true,
	name: true,
	logo: true,
});

export const storeDeleteSchema = storeSchema.pick({
	id: true,
});
