import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

export const userRole = pgEnum("user_role", ["ADMIN", "USER", "MERCHANT"]);
export const productStatus = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);
export const orderStatus = pgEnum("order_status", [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);
export const paymentStatus = pgEnum("payment_status", [
  "PENDING",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
]);

export const pgTable = pgTableCreator((name) => name);

// === Tables ===
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),

    // Authentication fields
    googleId: varchar("google_id", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    password: varchar("password", { length: 255 }),

    // Email verification
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerificationDetails: jsonb("email_verification_details").$type<
      Validation["email-verification-schema"]
    >(),

    // Password reset
    resetPasswordDetails:
      jsonb("reset_details").$type<Validation["password-reset-schema"]>(),

    // Profile fields
    role: userRole("role").default("USER").notNull(),
    name: varchar("name", { length: 255 }),
    image: varchar("image", { length: 255 }),
    phone: varchar("phone", { length: 20 }),
    address: jsonb("address").$type<Validation["address-schema"]>(),
    preferences: jsonb("preferences").default({}),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    googleIdx: index("user_google_idx").on(t.googleId),
    roleIdx: index("user_role_idx").on(t.role),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 21 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    // userAgent: text("user_agent"),
    // ipAddress: varchar("ip_address", { length: 45 }),
  },
  (t) => ({
    userIdx: index("session_user_idx").on(t.userId),
    expiresIdx: index("session_expires_idx").on(t.expiresAt),
  })
);

export const stores = pgTable(
  "stores",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    userId: varchar("user_id", { length: 21 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    username: varchar("username", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 255 }).notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    language: varchar("language", { length: 2 }).default("en"),
    logo: varchar("logo", { length: 255 }),
    banner: varchar("banner", { length: 255 }),
    bio: text("bio"),

    // email: varchar("email", { length: 255 }),
    // phone: varchar("phone", { length: 20 }),
    // website: varchar("website", { length: 255 }),
    // location: jsonb("location").$type<Validation["address-schema"]>().notNull(),
    // socialLinks: jsonb("social_links").default({}),
    // settings: jsonb("settings").default({}),
    // isVerified: boolean("is_verified").default(false),
  },
  (t) => ({
    usernameIdx: index("store_username_idx").on(t.username),
    userIdx: index("store_user_idx").on(t.userId),
    categoryIdx: index("store_category_idx").on(t.category),
    createdAtIdx: index("store_created_at_idx").on(t.createdAt),
  })
);

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
    storeId: varchar("store_id", { length: 255 })
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),

    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: productStatus("status").default("DRAFT").notNull(),
    images: varchar("images", { length: 255 }).array(),
    price: numeric("price", { precision: 10, scale: 2 }),
    discount: numeric("discount", { precision: 10, scale: 2 }),
    cost: numeric("cost", { precision: 10, scale: 2 }),
    tax: numeric("tax", { precision: 4, scale: 2 }).default("0"),
    stock: integer("stock"),
    isAlwaysAvailable: boolean("is_always_available").default(true),
    limitedAmountPerOrder: integer("limited_amount_per_order"),
    sku: varchar("sku", { length: 100 }).unique(),
    barcode: varchar("barcode", { length: 100 }),
    weight: numeric("weight", { precision: 10, scale: 2 }),
    dimensions: jsonb("dimensions").default({}),
    attributes: jsonb("attributes")
      .$type<Validation["product-attribute-schema"][]>()
      .default([]),
    combinations: jsonb("combinations")
      .$type<Validation["product-combination-schema"][]>()
      .default([]),
    properties: jsonb("properties")
      .$type<Validation["product-property-schema"][]>()
      .default([]),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at"),
  },
  (t) => ({
    slugIdx: index("product_slug_idx").on(t.slug),
    storeIdx: index("product_store_idx").on(t.storeId),
    statusIdx: index("product_status_idx").on(t.status),
    priceIdx: index("product_price_idx").on(t.price),
    skuIdx: index("product_sku_idx").on(t.sku),
    barcodeIdx: index("product_barcode_idx").on(t.barcode),
    publishedIdx: index("product_published_idx").on(t.isPublished),
    createdAtIdx: index("product_created_at_idx").on(t.createdAt),
  })
);

export const pages = pgTable(
  "pages",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 })
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (t) => ({
    urlIdx: index("page_url_idx").on(t.url),
    storeIdx: index("page_store_idx").on(t.storeId),
    createdAtIdx: index("page_created_at_idx").on(t.createdAt),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 })
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    userId: varchar("user_id", { length: 21 })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: orderStatus("status").default("PENDING").notNull(),
    paymentStatus: paymentStatus("payment_status").default("PENDING").notNull(),
    items: jsonb("items")
      .$type<Validation["order-item-schema"][]>()
      .default([]),
    subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
    tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
    shipping: numeric("shipping", { precision: 10, scale: 2 }).default("0"),
    total: numeric("total", { precision: 10, scale: 2 }).notNull(),
    shippingAddress: jsonb("shipping_address")
      .$type<Validation["address-schema"]>()
      .notNull(),
    billingAddress:
      jsonb("billing_address").$type<Validation["address-schema"]>(),
    notes: text("notes"),
    currency: varchar("currency", { length: 3 }).default("USD"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    estimatedDelivery: timestamp("estimated_delivery"),
    cancelReason: text("cancel_reason"),
    refundReason: text("refund_reason"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("order_user_idx").on(t.userId),
    storeIdx: index("order_store_idx").on(t.storeId),
    statusIdx: index("order_status_idx").on(t.status),
    paymentStatusIdx: index("order_payment_status_idx").on(t.paymentStatus),
    createdAtIdx: index("order_created_at_idx").on(t.createdAt),
  })
);

export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    productId: varchar("product_id", { length: 255 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 21 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orderId: varchar("order_id", { length: 255 })
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 255 }),
    content: text("content"),
    rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
    images: varchar("images", { length: 255 }).array(),
    isVerified: boolean("is_verified").default(false),
    helpful: integer("helpful").default(0),
    reply: text("reply"),
    repliedAt: timestamp("replied_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (t) => ({
    userIdx: index("review_user_idx").on(t.userId),
    productIdx: index("review_product_idx").on(t.productId),
    orderIdx: index("review_order_idx").on(t.orderId),
    ratingIdx: index("review_rating_idx").on(t.rating),
    createdAtIdx: index("review_created_at_idx").on(t.createdAt),
  })
);

// === Relations ===
export const userRelations = relations(users, ({ many }) => ({
  stores: many(stores),
  orders: many(orders),
  reviews: many(reviews),
  sessions: many(sessions),
}));

export const storeRelations = relations(stores, ({ one, many }) => ({
  user: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  pages: many(pages),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  reviews: many(reviews),
  orders: many(orders, { relationName: "product-orders" }),
}));

export const orderRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  products: many(products, { relationName: "product-orders" }),
  reviews: many(reviews),
}));

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const pageRelations = relations(pages, ({ one }) => ({
  store: one(stores, {
    fields: [pages.storeId],
    references: [stores.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export type UserRelations = typeof userRelations;
export type StoreRelations = typeof storeRelations;
export type ProductRelations = typeof productRelations;
export type OrderRelations = typeof orderRelations;
export type ReviewRelations = typeof reviewRelations;
export type SessionRelations = typeof sessionRelations;
export type PageRelations = typeof pageRelations;
