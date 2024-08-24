import { z } from "@/lib/zod";

export const userSchema = z.object(
  // <Record<keyof Omit<User, "googleId" | "createdAt">, any>>
  {
    id: z.stringRequired("id"),
    name: z.stringRequired("name"),
    image: z.stringRequired("image"),
    email: z.stringRequired("email").email("invalid email."),
    password: z
      .stringRequired("password")
      .min(6, "strong password can't be less than 6 characters.")
      .max(20, "ooh, 20 characters. make it less."),
  }
);

export const userAuthLoginSchema = userSchema.pick({
  email: true,
  password: true,
});

export const userAuthRegisterSchema = userSchema.pick({
  name: true,
  email: true,
  password: true,
});
