import { productStatus, storeStatus, userRole } from "@/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { z as zod } from "zod";

import { i18n } from "@/lib/locale";
import { z } from "@/lib/zod";

// STRICT: to db
export const userRoleSchema = createSelectSchema(userRole);
export type UserRole = zod.infer<typeof userRoleSchema>;

export const storeStatusSchema = createSelectSchema(storeStatus);
export type StoreStatus = zod.infer<typeof storeStatusSchema>;

export const productStatusSchema = createSelectSchema(productStatus);
export type ProductStatus = zod.infer<typeof productStatusSchema>;

const coordinatesSchema = z.object({
  latitude: z
    .number("latitude")
    .min(-90)
    .max(90)
    .describe("Latitude must be between -90 and 90 degrees"),
  longitude: z
    .number("longitude")
    .min(-180)
    .max(180)
    .describe("Longitude must be between -180 and 180 degrees"),
});

const addressSchema = z
  .object({
    street: z
      .string("street")
      .min(1, "Street cannot be empty")
      .max(100, "Street name too long"),
    city: z
      .string("city")
      .min(1, "City cannot be empty")
      .max(50, "City name too long"),
    state: z
      .string("state")
      .min(1, "State cannot be empty")
      .max(50, "State name too long"),
    country: z
      .string("country")
      .min(2, "Country code must be at least 2 characters")
      .max(50, "Country name too long"),
    postalCode: z
      .string("postalCode")
      .min(3, "Postal code must be at least 3 characters")
      .max(10, "Postal code too long")
      .regex(/^[A-Z0-9\s-]*$/i, "Invalid postal code format"),
    coordinates: coordinatesSchema.optional(),
  })
  .strict();
const emailVerificationSchema = z
  .object({
    code: z
      .string("code")
      .min(8, "Verification code must be 8 characters")
      .max(8, "Verification code must be 8 characters"),
    email: z.string("email").email("Invalid email address"),
    expiresAt: z.date("expiresAt"),
    attempts: z
      .number("attempts")
      .int("Attempts must be an integer")
      .min(0, "Attempts cannot be negative"),
  })
  .strict();

const passwordResetSchema = z
  .object({
    token: z
      .string("token")
      .min(32, "Token must be at least 32 characters")
      .max(256, "Token too long"),
    expiresAt: z.date("expiresAt"),
    used: z.boolean("used"),
  })
  .strict();

const productAttributeSchema = z
  .object({
    name: z
      .string("name")
      .min(1, "Attribute name cannot be empty")
      .max(50, "Attribute name too long"),
    // description: z
    //   .string("description")
    //   .max(500, "Description too long")
    //   .optional(),
    values: z
      .array(z.string("value"))
      .min(1, "Must have at least one value")
      .max(50, "Too many values"),
  })
  .strict();

// END STRICT

const userSchema = z.object({
  id: z.stringRequired("id"),
  name: z.string("name").nullable(),
  image: z.string("image").nullable(),
  phone: z.string("phone").nullable(),
  email: z.stringRequired("email").email("invalid email."),
  password: z.password("password"),
});

const storeSchema = z.object({
  id: z.stringRequired("id"),
  createdAt: z.date("created at"),
  updatedAt: z.date("updated at"),
  ownerId: z.stringRequired("ownerId"),

  username: z.stringRequired("username"),
  name: z.stringRequired("name"),
  logo: z.string("logo").nullable(),
  bio: z.string("bio").nullable(),
  status: z.enum(storeStatus.enumValues ?? []),
});

const productSchema = z.object({
  id: z.stringRequired("id"),
  createdAt: z.date("created at"),
  updatedAt: z.date("updated at"),
  storeId: z.stringRequired("storeId"),

  slug: z.stringRequired("slug"),
  title: z.stringRequired("title"),
  description: z.string("description").nullable(),
  status: z.enum(["draft", "active", "archived"]),
  images: z.array(z.string("images")).default([]).nullable(),

  cost: z.number("cost").positive("cost can't be less than 0."),
  price: z.number("price").positive("price can't be less than 0."),
  compareToPrice: z
    .number("compareToPrice")
    .positive("compare to price can't be less than 0."),

  attributes: z.array(productAttributeSchema),
});
export type ValidationName = keyof typeof validations;
export type Validation = {
  [K in ValidationName]: zod.infer<(typeof validations)[K]>;
};

export const validations = {
  "user-schema": userSchema,
  "store-schema": storeSchema,
  "product-schema": productSchema,

  "locale-switcher": z.object({ locale: z.enum(i18n?.locales) }),
  "login-with-password": userSchema.pick({
    email: true,
    password: true,
  }),
  "register-with-password": userSchema.pick({
    email: true,
    password: true,
  }),
  "verify-email": emailVerificationSchema.pick({ code: true }),
  "send-password-reset-link": userSchema.pick({ email: true }),
  "reset-password": userSchema.pick({ password: true }).and(
    z.object({
      confirmPassword: z.stringRequired("confirm password"),
      token: z.stringRequired("token"),
    })
  ),

  // users
  "update-user": userSchema.pick({
    id: true,
    name: true,
    image: true,
    phone: true,
  }),

  // stores
  "create-store": storeSchema.pick({
    name: true,
    username: true,
    bio: true,
    logo: true,
  }),
  "delete-store": storeSchema.pick({ id: true, logo: true }),

  // products
  "create-product": productSchema.pick({ storeId: true }),
  "update-product": productSchema
    .pick({
      id: true,
      storeId: true,
      title: true,
      slug: true,
      description: true,
      cost: true,
      price: true,
      compareToPrice: true,
      status: true,
      images: true,
      attributes: true,
    })
    .and(
      z.object({
        oldValues: productSchema.pick({ images: true }),
      })
    ),
  "delete-product": productSchema.pick({
    id: true,
    storeId: true,
    images: true,
  }),

  // cart
  "cart-product-schema": z.object({
    product: productSchema.pick({
      id: true,
      storeId: true,
      price: true,

      title: true,
      images: true,
    }),
    quantity: z.number("quantity").min(1, `quantity can't be less than 0.`),
    attributes: z
      .array(
        z.object({ name: z.string("name"), value: z.string("value") })

        // productAttributeSchema
        //   .pick({ name: true })
        //   .and(z.object({ name: z.string("name"),  value: z.string("value"),   }))
      )
      .default([]),
  }),

  // STRICT: db depends on this, we can add more but remove some needs to be handled.
  "address-schema": addressSchema,
  "email-verification-schema": emailVerificationSchema,
  "password-reset-schema": passwordResetSchema,
  "product-attribute-schema": productAttributeSchema,
  //  "product-combination-schema": productCombinationSchema,
  //  "product-property-schema": productPropertySchema,
  //  "order-item-schema": orderItemSchema,
  // END STRICT
};
