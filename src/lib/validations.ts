import { z as zod } from "zod";

import { i18n } from "@/lib/locale";
import { z } from "@/lib/zod";

export const userSchema = z.object({
  id: z.stringRequired("id"),
  name: z.stringRequired("name"),
  image: z.stringRequired("image"),
  email: z.stringRequired("email").email("invalid email."),
  password: z.password("password"),
});

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
  username: z.stringRequired("username"),

  name: z.stringRequired("name"),
  category: z.stringRequired("category"),
  currency: z.stringRequired("currency"),
  language: z.stringRequired("language"),

  logo: z.string("logo"),
  bio: z.string("bio"),
  location: addressSchema,
});

export type ValidationName = keyof typeof validations;
export type Validation = {
  [K in ValidationName]: zod.infer<(typeof validations)[K]>;
};
export const validations = {
  // STRICT: db depends on this, we can add more but remove some needs to be handled.
  "address-schema": addressSchema,
  "user-schema": userSchema,
  "store-schema": storeSchema,

  "locale-switcher": z.object({ locale: z.enum(i18n?.["locales"]) }),
  "login-with-password": userSchema.pick({
    email: true,
    password: true,
  }),
  "register-with-password": userSchema.pick({
    email: true,
    password: true,
  }),
  "verify-email": z.object({ code: z.stringRequired("code") }),
  "send-password-reset-link": userSchema.pick({ email: true }),
  "reset-password": userSchema.pick({ password: true }).and(
    z.object({
      confirmPassword: z.stringRequired("confirm password"),
      token: z.stringRequired("token"),
    })
  ),

  // stores
  "create-store": storeSchema.pick({
    name: true,
    category: true,
    currency: true,
    language: true,
    username: true,
    bio: true,
    logo: true,
    location: true,
  }),
};
