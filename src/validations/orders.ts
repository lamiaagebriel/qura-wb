import { ORDER_STATUS_ARR } from "@/constants/enums";
import { z } from "@/lib/zod";

export const orderDetailsSchema = z.object({
	products: z
		.array(
			z.object({
				productId: z.stringRequired("productId"),
				price: z.number("price"),
				quantity: z.number("quantity"),
				attributes: z
					.array(z.object({ name: z.string("name"), value: z.string("value") }))
					.default([]),
			}),
		)
		.min(1, "at least, order one product."),
	address: z.object({
		name: z.stringRequired("name"),
		phone: z
			.stringRequired("phone number")
			.regex(/^01[0,1,2,5][0-9]{8}$/, "only an egyptian phone number is valid."),
		address_line: z.string("address_line").optional(),
		zip: z.stringRequired("zip").regex(/^\d{5}$/, "Only egyptian zip is valid."),
		state: z.stringRequired("state"),
		city: z.stringRequired("city"),
		country: z.stringRequired("country"),
	}),
	paymentMethod: z.enum(["cash", "paypal"]),
});

export const orderSchema = z.object({
	id: z.stringRequired("id"),
	userId: z.stringRequired("userId"),
	storeId: z.stringRequired("storeId"),
	status: z.enum(ORDER_STATUS_ARR).default("PENDING"),
	details: orderDetailsSchema,
});

export const orderCreateSchema = orderSchema.pick({
	storeId: true,
	status: true,
	details: true,
});

export const orderUpdateSchema = orderSchema.pick({
	id: true,
	status: true,
});

export const orderDeleteSchema = orderSchema.pick({
	id: true,
});
