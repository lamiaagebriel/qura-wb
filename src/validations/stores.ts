import { z } from "@/lib/zod";
import { Store } from "@prisma/client";
import { ZodString } from "zod";

export const storeSchema = z.object<Record<keyof Omit<Store, "createdAt">, ZodString>>({
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
