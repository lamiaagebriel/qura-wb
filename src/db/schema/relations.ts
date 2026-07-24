import { relations } from "drizzle-orm";

import { accounts } from "./accounts";
import { sessions } from "./sessions";
import { users } from "./users";

/**
 * All cross-table relations live here (rather than inside each table's own
 * file) so tables that reference each other both ways never end up in a
 * circular import between schema files.
 *
 * `verifications` has no relation here on purpose — Better Auth's
 * verification model isn't linked to `users` by a foreign key (see
 * `verifications.ts`), so there's nothing to declare.
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
