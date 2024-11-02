import { z } from "@/lib/zod";
import { attributeSchema, productSchema } from "@/validations/products";

export const cartProductSchema = z.object({
	product: productSchema.pick({
		id: true,
		storeId: true,
		price: true,
		stock: true,

		name: true,
		images: true,
	}),
	quantity: z.number("quantity").min(1, `quantity can't be less than 0.`),
	attributes: z
		.array(
			attributeSchema
				.pick({
					name: true,
				})
				.and(z.object({ value: z.string("value") })),
		)
		.default([]),
});

export const cartAddressSchema = z.object({
	name: z.stringRequired("name"),
	phone: z
		.stringRequired("phone number")
		.regex(/^01[0,1,2,5][0-9]{8}$/, "only an egyptian phone number is valid."),
	address_line: z.string("address_line").optional(),
	zip: z.stringRequired("zip").regex(/^\d{5}$/, "Only egyptian zip is valid."),
	state: z.stringRequired("state"),
	city: z.stringRequired("city"),
	country: z.stringRequired("country"),
});
