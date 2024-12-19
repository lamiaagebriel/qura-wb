import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  json,
  numeric,
  pgEnum,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

export const pgTable = pgTableCreator((name) => name);
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 21 }).primaryKey(),
    googleId: varchar("google_id", { length: 255 }).unique(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    name: varchar("name", { length: 255 }),
    password: varchar("password", { length: 255 }),
    image: varchar("image", { length: 255 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    emailIdx: index("user_email_idx").on(t.email),
    googleIdx: index("user_google_idx").on(t.googleId),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => ({
    userIdx: index("session_user_idx").on(t.userId),
  })
);

// TODO: these two could be minizied in `users` table
// Just remove these schemas, and update `auth` file.
export const emailVerificationCodes = pgTable(
  "email_verification_codes",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 21 }).unique().notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 8 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => ({
    userIdx: index("verification_code_user_idx").on(t.userId),
    emailIdx: index("verification_code_email_idx").on(t.email),
  })
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: varchar("id", { length: 40 }).primaryKey(),
    userId: varchar("user_id", { length: 21 }).notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  },
  (t) => ({
    userIdx: index("password_token_user_idx").on(t.userId),
  })
);

export const stores = pgTable(
  "stores",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).notNull().unique(),

    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 255 }).notNull(),

    currency: varchar("currency", { length: 255 }), // base currency
    language: varchar("language", { length: 255 }), // base language

    logo: varchar("logo", { length: 255 }),
    bio: text("bio"),

    location: json("location").$type<Validation["address-schema"]>().notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    usernamex: index("store_username_idx").on(t.username),
    userIdx: index("store_user_idx").on(t.userId),
    createdAtIdx: index("store_created_at_idx").on(t.createdAt),
  })
);

export const pages = pgTable(
  "pages",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 }).notNull(),
    url: varchar("url", { length: 255 }).notNull().unique(),

    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    urlx: index("page_url_idx").on(t.url),
    storeIdx: index("page_store_idx").on(t.storeId),
    createdAtIdx: index("page_created_at_idx").on(t.createdAt),
  })
);

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),

    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    // status: pgEnum("status", ["DRAFT", "ACTIVE", "ARCHIVE"]),
    images: varchar("images", { length: 255 }).array(),

    price: numeric("price", { precision: 2 }),
    discount: numeric("discount", { precision: 2 }),
    cost: numeric("cost", { precision: 2 }),
    // tax Int? // default to 0

    // stock                 Int? // limited amount || always avaliable
    // limitedAmountPerOrder Int?

    // attributes Json[]   @default([]) // {name: string, desc?: string, values: string[]}
    // compinations Json // cost, price, discount, stock, isAlwaysAvailable
    // الخصائص، نوع الكاميرا ....
    // properties // {name: brand, value: Apple}

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    slugx: index("product_slug_idx").on(t.slug),
    storeIdx: index("product_store_idx").on(t.storeId),
    createdAtIdx: index("product_created_at_idx").on(t.createdAt),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    storeId: varchar("store_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),

    // status: pgEnum("status", [
    //   "PENDING",
    //   "CONFIRMED",
    //   "DECLINED",
    //   "DELIVERYING",
    //   "DELIVERYED",
    //   "CANCELLED",
    // ]),
    details: json("details").array(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    userIdx: index("order_user_idx").on(t.userId),
    storeIdx: index("order_store_idx").on(t.storeId),
    createdAtIdx: index("order_created_at_idx").on(t.createdAt),
  })
);

export const reviews = pgTable(
  "reviews",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    productId: varchar("product_id", { length: 255 }).notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),

    content: text("content"),
    rating: numeric("rating", { precision: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date()
    ),
  },
  (t) => ({
    userIdx: index("review_user_idx").on(t.userId),
    productIdx: index("review_product_idx").on(t.productId),
    createdAtIdx: index("review_created_at_idx").on(t.createdAt),
  })
);

export const storeRelations = relations(stores, ({ one, many }) => ({
  user: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
  pages: many(pages, { relationName: "store-pages" }),
  products: many(products, { relationName: "store-products" }),
  orders: many(orders, { relationName: "store-orders" }),
}));
export type Store = typeof stores.$inferSelect;
export type NewStore = typeof stores.$inferInsert;
