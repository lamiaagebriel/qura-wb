import { relations } from "drizzle-orm";
import { index, json, pgEnum } from "drizzle-orm/pg-core";

import { products, stores, users } from "@/servers/db/schema";
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

// === Tables ===
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

// === Relations ===
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
  // reviews: many(reviews),
}));

export type Order = typeof orders.$inferSelect;

export type OrderRelations = typeof orderRelations;
