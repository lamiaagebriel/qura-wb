import { relations } from "drizzle-orm";

export * from "./users";
export * from "./stores";
export * from "./products";

import { sessions, users } from "./users";
import { stores } from "./stores";
import { products } from "./products";

export const userRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),

  stores: many(stores),
  // orders: many(orders),
  // reviews: many(reviews),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const storeRelations = relations(stores, ({ one, many }) => ({
  user: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),

  products: many(products),
  // orders: many(orders),
  // pages: many(pages),
}));
export const productRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  // reviews: many(reviews),
  // orders: many(orders, { relationName: "product-orders" }),
}));

export type UserRelations = typeof userRelations;
export type SessionRelations = typeof sessionRelations;

export type StoreRelations = typeof storeRelations;
export type ProductRelations = typeof productRelations;
