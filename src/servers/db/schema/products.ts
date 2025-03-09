import { relations } from "drizzle-orm";
import { index, integer as int, json, pgEnum, text } from "drizzle-orm/pg-core";

import { orders, stores } from "@/servers/db/schema";
import {
  decimal,
  id,
  pgTable,
  references,
  timestamp,
  varchar,
} from "@/servers/db/utils";
import { Validation } from "@/lib/validations";

// === Enums ===
export const productStatus = pgEnum("product_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

// === Tables ===
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
    compareToPrice: decimal("compare_to_price"),
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

// === Relations ===
export const productRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  // reviews: many(reviews),
  orders: many(orders, { relationName: "product-orders" }),
}));

export type Product = typeof products.$inferSelect;
export type ProductRelations = typeof productRelations;
