import { z } from "@/lib/zod";

export const addressSchema = z.object({
	country: z.stringRequired("country"),
	city: z.stringRequired("city"),
	state: z.stringRequired("state"),
	zip: z.stringRequired("zip").regex(/^\d{5}$/, "Only egyptian zip is valid."),

	addressLine: z.string("address line").optional(),
	coordinates: z
		.object({
			lat: z.number("latitude"),
			lng: z.number("longitude"),
		})
		.optional(),
});

export const storeSchema = z.object({
	id: z.stringRequired("id"),
	userId: z.stringRequired("userId"),

	name: z.stringRequired("name"),
	category: z.stringRequired("category"),
	currency: z.stringRequired("currency"),
	language: z.stringRequired("language"),

	username: z.stringRequired("username"),

	bio: z.string("bio").nullable().optional(),
	logo: z.string("logo").nullable().optional(),
	location: addressSchema,
});

export const storeCreateSchema = storeSchema.pick({
	name: true,
	category: true,
	currency: true,
	language: true,

	username: true,

	bio: true,
	logo: true,
	location: true,
});

export const storeUpdateSchema = storeSchema.pick({
	id: true,
	name: true,
	logo: true,
	category: true,
});

export const storeDeleteSchema = storeSchema.pick({
	id: true,
});
