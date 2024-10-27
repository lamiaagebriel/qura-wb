import { z } from "@/lib/zod";

export const storeSchema = z.object({
	id: z.stringRequired("id"),
	userId: z.stringRequired("userId"),
	name: z.stringRequired("name"),
});

export const storeCreateSchema = storeSchema.pick({
	name: true,
});

export const storeUpdateSchema = storeSchema.pick({
	id: true,
	name: true,
});

export const storeDeleteSchema = storeSchema.pick({
	id: true,
});
