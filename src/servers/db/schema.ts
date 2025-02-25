import { relations } from "drizzle-orm";
import {
  decimal as _decimal,
  timestamp as _timestamp,
  varchar as _varchar,
  boolean,
  index,
  integer as int,
  json,
  PgColumn,
  pgEnum,
  pgTableCreator,
  ReferenceConfig,
  text,
} from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

// === Enums ===
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

// === Utils ===
const varchar = (k: string, p: { length: number } = { length: 255 }) =>
  _varchar(k, p);
const timestamp = (k: string) =>
  _timestamp(k, { withTimezone: true, mode: "date" });
const decimal = (
  k: string,
  p: { precision: number; scale: number } = { precision: 10, scale: 2 }
) => _decimal(k, p);

const id = (k: string, p: { length: number } = { length: 255 }) =>
  varchar(k, p).primaryKey().notNull();

const references = (
  k: string,
  p: { length: number } = { length: 255 },
  ref: PgColumn,
  actions?: ReferenceConfig["actions"]
) => varchar(k, p).references(() => ref, actions);

// === Tables ===
export const users = pgTable(
  "users",
  {
    id: id("id", { length: 21 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),

    // Authentication fields
    email: varchar("email").unique().notNull(),
    googleId: varchar("google_id").unique(),
    password: varchar("password"),

    // Email verification
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerificationDetails: json("email_verification_details").$type<
      Validation["email-verification-schema"]
    >(),

    // Password reset
    resetPasswordDetails:
      json("reset_details").$type<Validation["password-reset-schema"]>(),

    // Profile fields
    role: userRole("role").default("USER").notNull(),
    name: varchar("name"),
    image: varchar("image"),
    phone: varchar("phone", { length: 20 }),
    address: json("address").$type<Validation["address-schema"]>(),
    preferences: json("preferences").default({}),
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
    id: varchar("id").primaryKey(),
    userId: references("user_id", { length: 21 }, users?.id, {
      onDelete: "cascade",
    }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),

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
    id: id("id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),

    userId: references("user_id", { length: 21 }, users.id, {
      onDelete: "cascade",
    }),

    username: varchar("username").notNull().unique(),
    name: varchar("name").notNull(),
    category: varchar("category").notNull(),
    currency: varchar("currency", { length: 3 }).default("USD"),
    language: varchar("language", { length: 2 }).default("en"),
    logo: varchar("logo"),
    banner: varchar("banner"),
    bio: text("bio"),

    // email: varchar("email",  ),
    // phone: varchar("phone", { length: 20 }),
    // website: varchar("website", { length: 255 }),
    // location: json("location").$type<Validation["address-schema"]>().notNull(),
    // socialLinks: json("social_links").default({}),
    // settings: json("settings").default({}),
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
    id: id("id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),

    storeId: references("store_id", { length: 255 }, stores.id, {
      onDelete: "cascade",
    }).notNull(),

    slug: varchar("slug").notNull().unique(),
    title: varchar("title").notNull(),
    description: text("description"),
    status: productStatus("status").default("DRAFT").notNull(),
    images: json("images").$type<string[]>(),
    stock: int("stock"),
    price: decimal("price"),
    discount: decimal("discount"),
    cost: decimal("cost"),
    // tax: decimal("tax", { precision: 4, scale: 2 }).default("0"),

    // isAlwaysAvailable: boolean("is_always_available").default(true),
    // limitedAmountPerOrder: int("limited_amount_per_order"),
    // sku: varchar("sku", { length: 100 }).unique(),
    // barcode: varchar("barcode", { length: 100 }),
    // weight: decimal("weight"),
    // dimensions: json("dimensions").default({}),
    attributes: json("attributes")
      .$type<Validation["product-attribute-schema"][]>()
      .default([]),
    // combinations: json("combinations")
    //   .$type<Validation["product-combination-schema"][]>()
    //   .default([]),
    // properties: json("properties")
    //   .$type<Validation["product-property-schema"][]>()
    //   .default([]),
    // metaTitle: varchar("meta_title", { length: 255 }),
    // metaDescription: text("meta_description"),
    // isPublished: boolean("is_published").default(false),
    // publishedAt: timestamp("published_at"),
  },
  (t) => ({
    slugIdx: index("product_slug_idx").on(t.slug),
    storeIdx: index("product_store_idx").on(t.storeId),
    statusIdx: index("product_status_idx").on(t.status),
    priceIdx: index("product_price_idx").on(t.price),
    // skuIdx: index("product_sku_idx").on(t.sku),
    // barcodeIdx: index("product_barcode_idx").on(t.barcode),
    // publishedIdx: index("product_published_idx").on(t.isPublished),
    createdAtIdx: index("product_created_at_idx").on(t.createdAt),
  })
);

export const pages = pgTable(
  "pages",
  {
    id: id("id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),
    storeId: references("store_id", { length: 255 }, stores.id, {
      onDelete: "cascade",
    }).notNull(),

    url: varchar("url").notNull().unique(),
    title: varchar("title").notNull(),
    body: text("body"),
    isPublished: boolean("is_published").default(false),
    publishedAt: timestamp("published_at"),
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
    id: id("id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),
    storeId: references("store_id", { length: 255 }, stores.id, {
      onDelete: "restrict",
    }).notNull(),
    userId: references("user_id", { length: 21 }, users.id, {
      onDelete: "restrict",
    }), // null is allowed, to create orders for non-existing users.

    status: orderStatus("status").default("PENDING").notNull(),
    paymentStatus: paymentStatus("payment_status").default("PENDING").notNull(),
    items: json("items").$type<Validation["order-item-schema"][]>().default([]),
    total: decimal("total").notNull(),
    shippingAddress: json("shipping_address")
      .$type<Validation["address-schema"]>()
      .notNull(),

    actions: json("actions").$type<Validation["order-action"][]>().default([]),

    // subtotal: decimal("subtotal").notNull(),
    // tax: decimal("tax").default("0"),
    // shipping: decimal("shipping").default("0"),
    // billingAddress: json("billing_address").$type<Validation["address-schema"]>(),
    // notes: text("notes"),
    // currency: varchar("currency", { length: 3 }).default("USD"),
    // trackingNumber: varchar("tracking_number", { length: 100 }),
    // estimatedDelivery: timestamp("estimated_delivery"),
    // cancelReason: text("cancel_reason"),
    // refundReason: text("refund_reason"),
    // metadata: json("metadata").default({}),
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
    id: id("id", { length: 255 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$defaultFn(() => new Date())
      .notNull(),
    orderId: references("order_id", { length: 255 }, orders.id, {
      onDelete: "restrict",
    }).notNull(),
    productId: references("product_id", { length: 255 }, products.id, {
      onDelete: "cascade",
    }).notNull(),
    userId: references("user_id", { length: 21 }, users.id, {
      onDelete: "cascade",
    }).notNull(),

    title: varchar("title"),
    content: text("content"),
    rating: decimal("rating", { precision: 2, scale: 1 }).notNull(),
    images: varchar("images").$type<string[]>(),
    isVerified: boolean("is_verified").default(false),
    helpful: int("helpful").default(0),
    reply: text("reply"),
    repliedAt: timestamp("replied_at"),
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
