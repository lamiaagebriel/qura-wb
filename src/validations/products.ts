import { z } from "@/lib/zod";
import { Product } from "@prisma/client";
import { ZodString } from "zod";

export const productSchema = z.object<Record<keyof Omit<Product, "createdAt">, ZodString>>({
	id: z.stringRequired("id"),
	storeId: z.stringRequired("storeId"),
	name: z.stringRequired("name"),
});

export const productCreateSchema = productSchema.pick({
	storeId: true,
	name: true,
});

export const productUpdateSchema = productSchema.pick({
	id: true,
	name: true,
});

export const productDeleteSchema = productSchema.pick({
	id: true,
});
