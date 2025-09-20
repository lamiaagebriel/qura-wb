import { stores } from "@/db/schema";
import {
  decimal,
  id,
  pgTable,
  references,
  timestamp,
  varchar,
} from "@/db/utils";
import { index, json, pgEnum, text } from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

export const productStatus = pgEnum("product_status", [
  "draft",
  "active",
  "archived",
]);

// === Tables ===
export const products = pgTable(
  "qurawb__products",
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
    status: productStatus("status").default("draft").notNull(),
    images: json("images").$type<string[]>(),

    price: decimal("price"),
    compareToPrice: decimal("compare_to_price"),
    cost: decimal("cost"),

    attributes: json("attributes")
      .$type<Validation["product-attribute-schema"][]>()
      .default([]),
  },
  (t) => ({
    slugIdx: index("product_slug_idx").on(t.slug),
    storeIdx: index("product_store_idx").on(t.storeId),
    statusIdx: index("product_status_idx").on(t.status),
    priceIdx: index("product_price_idx").on(t.price),
    createdAtIdx: index("product_created_at_idx").on(t.createdAt),
  })
);

export type Product = typeof products.$inferSelect;
