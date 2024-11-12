import { z } from "@/lib/zod";
import { pageSchema } from "./pages";

export const addressSchema = z.object({
	// name: z.stringRequired("name"),
	// phone: z
	// 	.stringRequired("phone number")
	// 	.regex(/^01[0,1,2,5][0-9]{8}$/, "only an egyptian phone number is valid."),
	addressLine: z.string("address line").optional(),
	zip: z.stringRequired("zip").regex(/^\d{5}$/, "Only egyptian zip is valid."),
	state: z.stringRequired("state"),
	city: z.stringRequired("city"),
	country: z.stringRequired("country"),
	// coordinates: {
	// 	latitude: 40.7128,
	// 	longitude: -74.0060,
	// },
});

export const storeSchema = z.object({
	id: z.stringRequired("id"),
	userId: z.stringRequired("userId"),
	name: z.stringRequired("name"),
	username: z.stringRequired("username"),
	bio: z.string("bio").nullable().optional(),
	logo: z.string("logo").nullable().optional(),
	category: z.stringRequired("category"),
	location: addressSchema,
	pages: z.array(pageSchema).default([]),
});

export const storeCreateSchema = storeSchema.pick({
	name: true,
	username: true,
	category: true,
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
