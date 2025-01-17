import { createSelectSchema } from "drizzle-zod";
import { z as zod } from "zod";

import {
  orderStatus,
  paymentStatus,
  productStatus,
  userRole,
} from "@/servers/db/schema";
import { i18n } from "@/lib/locale";
import { z } from "@/lib/zod";

// STRICT: to db
export const userRoleSchema = createSelectSchema(userRole);
export type UserRole = zod.infer<typeof userRoleSchema>;

export const productStatusSchema = createSelectSchema(productStatus);
export type ProductStatus = zod.infer<typeof productStatusSchema>;

export const orderStatusSchema = createSelectSchema(orderStatus);
export type OrderStatus = zod.infer<typeof orderStatusSchema>;

export const paymentStatusSchema = createSelectSchema(paymentStatus);
export type PaymentStatus = zod.infer<typeof paymentStatusSchema>;

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
    description: z
      .string("description")
      .max(500, "Description too long")
      .optional(),
    values: z
      .array(z.string("value"))
      .min(1, "Must have at least one value")
      .max(50, "Too many values"),
  })
  .strict();

const productCombinationSchema = z
  .object({
    attributes: z.record(z.string("attributes")),
    price: z.number("price").min(0, "Price cannot be negative").optional(),
    discount: z
      .number("discount")
      .min(0, "Discount cannot be negative")
      .max(100, "Discount cannot exceed 100%")
      .optional(),
    cost: z.number("cost").min(0, "Cost cannot be negative").optional(),
    stock: z
      .number("stock")
      .int("Stock must be an integer")
      .min(0, "Stock cannot be negative")
      .optional(),
    isAlwaysAvailable: z.boolean("isAlwaysAvailable").optional(),
    sku: z.string("sku").max(50, "SKU too long").optional(),
    barcode: z.string("barcode").max(50, "Barcode too long").optional(),
  })
  .strict();

const productPropertySchema = z
  .object({
    name: z
      .string("name")
      .min(1, "Property name cannot be empty")
      .max(50, "Property name too long"),
    value: z
      .string("value")
      .min(1, "Property value cannot be empty")
      .max(100, "Property value too long"),
    unit: z.string("unit").max(20, "Unit too long").optional(),
  })
  .strict();

const orderItemSchema = z
  .object({
    productId: z.string("productId").min(1, "Product ID cannot be empty"),
    variantId: z
      .string("variantId")
      .min(1, "Variant ID cannot be empty")
      .optional(),
    quantity: z
      .number("quantity")
      .int("Quantity must be an integer")
      .positive("Quantity must be positive"),
    price: z.number("price").min(0, "Price cannot be negative"),
    discount: z
      .number("discount")
      .min(0, "Discount cannot be negative")
      .max(100, "Discount cannot exceed 100%")
      .optional(),
    tax: z.number("tax").min(0, "Tax cannot be negative").optional(),
    total: z.number("total").min(0, "Total cannot be negative"),
  })
  .strict();

// END STRICT to db

const userSchema = z.object({
  id: z.stringRequired("id"),
  name: z.stringRequired("name"),
  image: z.stringRequired("image"),
  email: z.stringRequired("email").email("invalid email."),
  password: z.password("password"),
});

const storeSchema = z.object({
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

const productSchema = z.object({
  storeId: z.stringRequired("storeId"),
});

export type ValidationName = keyof typeof validations;
export type Validation = {
  [K in ValidationName]: zod.infer<(typeof validations)[K]>;
};

export const validations = {
  // STRICT: db depends on this, we can add more but remove some needs to be handled.
  "address-schema": addressSchema,
  "email-verification-schema": emailVerificationSchema,
  "password-reset-schema": passwordResetSchema,
  "product-attribute-schema": productAttributeSchema,
  "product-combination-schema": productCombinationSchema,
  "product-property-schema": productPropertySchema,
  "order-item-schema": orderItemSchema,
  // END STRICT

  "user-schema": userSchema,
  "store-schema": storeSchema,

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

  // products
  "create-product": productSchema.pick({ storeId: true }),
};
