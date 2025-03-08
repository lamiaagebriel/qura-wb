import { relations } from "drizzle-orm";
import { index, text } from "drizzle-orm/pg-core";

import { orders, products, users } from "@/servers/db/schema";
import {
  id,
  pgTable,
  references,
  timestamp,
  varchar,
} from "@/servers/db/utils";

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

// === Relations ===
export const storeRelations = relations(stores, ({ one, many }) => ({
  user: one(users, {
    fields: [stores.userId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  // pages: many(pages),
}));

export type Store = typeof stores.$inferSelect;

export type StoreRelations = typeof storeRelations;
