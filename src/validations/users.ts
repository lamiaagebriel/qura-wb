import { z } from "@/lib/zod";

export const userSchema = z.object({
	id: z.stringRequired("id"),
	name: z.stringRequired("name"),
	image: z.stringRequired("image"),
	email: z.stringRequired("email").email("invalid email."),
	password: z
		.stringRequired("password")
		.min(6, "strong password can't be less than 6 characters.")
		.max(20, "ooh, 20 characters. make it less."),
});

export const userLoginSchema = userSchema.pick({
	email: true,
	password: true,
});

export const userRegisterSchema = userSchema.pick({
	name: true,
	email: true,
	password: true,
});
