import { z } from "@/lib/zod";

export const reviewSchema = z.object({
	id: z.stringRequired("id"),
	userId: z.stringRequired("userId"),
	productId: z.stringRequired("productId"),
	rating: z
		.number("rating")
		.min(0, "rating can't be less than 0.")
		.max(5, "rating can't be more than 5."),
	content: z.stringRequired("content"),
});

export const reviewCreateSchema = reviewSchema.pick({
	productId: true,
	rating: true,
	content: true,
});

export const reviewUpdateSchema = reviewSchema.pick({
	id: true,
	rating: true,
	content: true,
});

export const reviewDeleteSchema = reviewSchema.pick({
	id: true,
});
