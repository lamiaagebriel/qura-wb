import { orderStatus, productStatus, storeStatus, userRole } from "@/db/schema";
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

export const orderStatusSchema = createSelectSchema(orderStatus);
export type OrderStatus = zod.infer<typeof orderStatusSchema>;

export const orderPaymentMethod = ["paying__cod", "paying__instapay"] as const;
export const orderPaymentStatus = [
  "unpaid",
  "paid",
  "pending",
  "failed",
  "refunded",
] as const;
export const orderPaymentMethodsSchema = z.enum(orderPaymentMethod);
export type OrderPaymentMethod = zod.infer<typeof orderPaymentMethodsSchema>;

const coordinatesSchema = z.object({
  latitude: z.coerce
    .number("latitude")
    .min(-90)
    .max(90)
    .describe("Latitude must be between -90 and 90 degrees"),
  longitude: z.coerce
    .number("longitude")
    .min(-180)
    .max(180)
    .describe("Longitude must be between -180 and 180 degrees"),
});

const addressSchema = z
  .object({
    street: z.string("street").optional(),
    city: z.stringRequired("city"), // daraw
    state: z.stringRequired("state"), // aswan
    country: z.stringRequired("country"), // egypt
    postalCode: z
      .stringRequired("postal code")
      .regex(/^[A-Z0-9\s-]*$/i, "Invalid postal code format")
      .regex(/^\d{5}$/, "Only egyptian postal code is valid."),
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
    attempts: z.coerce
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
  status: z.enum(productStatus.enumValues ?? []),
  images: z.array(z.string("images")).default([]).nullable(),

  cost: z.coerce.number("cost").positive("cost can't be less than 0."),
  price: z.coerce.number("price").positive("price can't be less than 0."),
  compareToPrice: z.coerce
    .number("compareToPrice")
    .positive("compare to price can't be less than 0."),

  attributes: z.array(productAttributeSchema),
});

const cartProductSchema = productSchema
  .pick({
    id: true,
    storeId: true,

    title: true,
    images: true,
  })
  .and(
    z.object({
      // NOTE: only used for form handling
      quantity: z.coerce
        .number("quantity")
        .min(1, `quantity can't be less than 0.`)
        .optional(),

      attributes: z
        .array(
          z.object({
            name: z.string("name"),
            value: z.string("value"),

            quantity: z.coerce
              .number("quantity")
              .min(1, `quantity can't be less than 0.`),
            price: z.coerce
              .number("price")
              .positive("price can't be less than 0."),
          })
        )
        .default([]),
    })
  );

const orderSchema = z.object({
  id: z.stringRequired("id"),
  createdAt: z.date("created at"),
  updatedAt: z.date("updated at"),
  storeId: z.stringRequired("storeId"),
  userId: z.stringRequired("userId").nullable(),

  status: z.enum(orderStatus.enumValues ?? []).default("pending"),
  address: z
    .array(
      addressSchema.extend(
        // z.object({
        {
          name: z.stringRequired("name"),
          phones: z
            .array(
              z.stringRequired("phone number")
              // .regex(
              //   /^01[0,1,2,5][0-9]{8}$/,
              //   "only an egyptian phone number is valid."
              // )
            )
            .min(1, "you must have one phone at least."),
        }
        // })
      )
    )
    .min(1, "you must have one address at least.")
    .max(1, "you can't have more than one address selected."),

  items: z
    .array(cartProductSchema)
    .min(1, "Order must have at least one item."),

  expenses: z
    .object({
      shipping: z.coerce
        .number("shipping")
        .min(0, "Shipping can't be less than 0"),
      discount: z.coerce
        .number("discount")
        .min(0, "Discount can't be less than 0")
        .optional(),
    })
    .default({ shipping: 0, discount: 0 }),
  actions: z
    .array(
      z.discriminatedUnion("action", [
        z.object({
          action: z.literal("order_initiated"),
          actorId: z.stringRequired("actorId"),
          // data: z.object({}).nullable().optional(), // No data required for "created"
        }),
        z.object({
          action: z.literal("paying__cod"),
          actorId: z.stringRequired("actorId"),
        }),
        z.object({
          action: z.literal("paying__instapay"),
          actorId: z.stringRequired("actorId"),
          data: z
            .object({
              amount: z.coerce
                .number("amount")
                .min(0, "Amount can't be less than 0"),
              username: z.stringRequired("username"),
            })
            .required(),
        }),
      ])
    )
    .min(1, "Order must have at least one action."),
  // transactions: z
  //   .array(
  //     z
  //       .object({
  //         type: z.enum(orderPaymentMethod.enumValues ?? []).default("cod"),
  //         status: z
  //           .enum(orderPaymentStatus.enumValues ?? [])
  //           .default("pending"),

  //         // TODO: add createdAt, sentAt
  //         amount: z.coerce
  //           .number("amount")
  //           .min(0, "Amount can't be less than 0")
  //           .optional(),
  //         username: z.string("username").optional(),
  //       })
  //       .superRefine((val, ctx) => {
  //         if (val.type === "cod") {
  //           ctx.value.amount = undefined;
  //           ctx.value.username = undefined;
  //         }

  //         if (val.type === "instapay") {
  //           if (
  //             val.amount === undefined ||
  //             val.amount === null ||
  //             Number.isNaN(val.amount)
  //           ) {
  //             ctx.addIssue({
  //               code: "custom",
  //               message: "Amount is required for instapay.",
  //               path: ["amount"],
  //             });
  //           }
  //           if (!val.username) {
  //             ctx.addIssue({
  //               code: "custom",
  //               message: "Username is required for instapay.",
  //               path: ["username"],
  //             });
  //           }
  //         }
  //       })
  //   )
  //   .min(1, "Order must have at least one transaction."),

  notes: z.string("notes").nullable().optional(),
});

export type ValidationName = keyof typeof validations;
export type Validation = {
  [K in ValidationName]: zod.infer<(typeof validations)[K]>;
};

export const validations = {
  "user-schema": userSchema,
  "store-schema": storeSchema,
  "product-schema": productSchema,
  "order-schema": orderSchema,

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
  "cart-product-schema": cartProductSchema,

  // orders
  "create-order": orderSchema.pick({
    storeId: true,
    userId: true,
    status: true,
    address: true,
    items: true,
    expenses: true,
    actions: true,
    notes: true,
  }),
  "update-order": orderSchema.pick({
    id: true,
    // userId: true,
    // status: true,
    // address: true,
    // items: true,
    // expenses: true,
    actions: true,
    // notes: true,
  }),
  "delete-order": orderSchema.pick({ id: true }),

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
