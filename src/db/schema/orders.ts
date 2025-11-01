import { stores, users } from "@/db/schema";
import { defaultFields, pgTable, references } from "@/db/utils";
// === Tables ===
import { index, json, pgEnum, text } from "drizzle-orm/pg-core";

import { Validation } from "@/lib/validations";

export const orderStatus = pgEnum("order_status", [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
  "failed",
]);

export const orders = pgTable(
  "qurawb__orders",
  {
    ...defaultFields,
    storeId: references("store_id", { length: 255 }, stores.id, {
      onDelete: "restrict",
    }).notNull(),
    userId: references("user_id", { length: 255 }, users.id, {
      onDelete: "restrict",
    }),
    status: orderStatus("status").default("pending").notNull(),
    address: json("address").$type<Validation["order-schema"]["address"]>(),
    items: json("items").$type<Validation["order-schema"]["items"]>(),
    expenses: json("expenses").$type<Validation["order-schema"]["expenses"]>(),
    actions: json("actions").$type<Validation["order-schema"]["actions"]>(), // NOTE: it has actor, connected to users schema
    // transactions:
    //   json("transactions").$type<Validation["order-schema"]["transactions"]>(),

    notes: text("notes"),
  },
  (t) => ({
    storeIdx: index("order_store_idx").on(t.storeId),
    createdAtIdx: index("order_created_at_idx").on(t.createdAt),
    userIdIdx: index("order_user_id_idx").on(t.userId),
    statusIdx: index("order_status_idx").on(t.status),
  })
);

// // Order Items table
// export const orderItems = pgTable(
//   "qurawb__order_items",
//   {
//     ...defaultFields,
//     orderId: references("order_id", { length: 255 }, orders.id, {
//       onDelete: "cascade",
//     }).notNull(),
//     productId: varchar("product_id", { length: 255 }).notNull(),
//     quantity: numeric("quantity").notNull(),
//     price: numeric("price").notNull(),
//     attributes: json("attributes").$type<unknown>(),
//     // Optionally, keep a product snapshot
//     productSnapshot: json("product_snapshot").$type<unknown>(),
//   },
//   (t) => ({
//     orderIdx: index("order_item_order_idx").on(t.orderId),
//     productIdx: index("order_item_product_idx").on(t.productId),
//   })
// );

// export const transactions = pgTable(
//   "qurawb__transactions",
//   {
//     ...defaultFields,
//     orderId: references("order_id", { length: 255 }, orders.id, {
//       onDelete: "cascade",
//     }).notNull(),

//     paymentMethod: orderPaymentMethod("payment_method")
//       .notNull()
//       .default("cod"),
//     paymentStatus: orderPaymentStatus("payment_status")
//       .notNull()
//       .default("unpaid"),
//     amount: numeric("amount").default("0").notNull(),
//     // transactionReference: varchar("transaction_reference", { length: 128 }),

//     notes: text("notes"),
//   },
//   (t) => ({
//     orderIdx: index("transaction_order_idx").on(t.orderId),
//     paymentStatusIdx: index("transaction_payment_status_idx").on(
//       t.paymentStatus
//     ),
//     paymentMethodIdx: index("transaction_payment_method_idx").on(
//       t.paymentMethod
//     ),
//     createdAtIdx: index("transaction_created_at_idx").on(t.createdAt),
//   })
// );

export type Order = typeof orders.$inferSelect;
// export type OrderItem = typeof orderItems.$inferSelect;
// export type Transaction = typeof transactions.$inferSelect;
