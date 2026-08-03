import { relations } from "drizzle-orm";

import { accounts } from "./auth.accounts";
import { sessions } from "./auth.sessions";
import { users } from "./g.users";

/**
 * Pure auth <-> auth relations only (sessions/accounts belong to a user).
 * The reverse `users` many-side, plus every relation that crosses into the
 * business domain (businesses, posts, reviews, comments, ...), lives in
 * `relations.ts` instead so this file never has to import business-domain
 * schema files — auth stays self-contained.
 *
 * `verifications` has no relation here on purpose — Better Auth's
 * verification model isn't linked to `users` by a foreign key (see
 * `auth.verifications.ts`), so there's nothing to declare.
 */
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
