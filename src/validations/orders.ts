import { ORDER_STATUS_ARR } from "@/constants/enums";
import { cartAddressSchema } from "@/lib/redux/validations";
import { z } from "@/lib/zod";
import { attributeSchema } from "./products";

export const orderDetailsSchema = z.object({
	products: z
		.array(
			z.object({
				productId: z.stringRequired("productId"),
				price: z.number("price"),
				quantity: z.number("quantity"),
				attributes: z
					.array(
						attributeSchema
							.pick({
								name: true,
							})
							.and(z.object({ value: z.string("value") })),
					)
					.default([]),
			}),
		)
		.min(1, "at least, order one product."),
	address: cartAddressSchema,
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
