import { relations } from "drizzle-orm";

import { stores } from "./stores";
import { sessions, users } from "./users";

export * from "./stores";
export * from "./users";

export const userRelations = relations(users, ({ many }) => ({
  stores: many(stores),
  sessions: many(sessions),
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
}));

export type UserRelations = typeof userRelations;
export type SessionRelations = typeof sessionRelations;
export type StoreRelations = typeof storeRelations;
