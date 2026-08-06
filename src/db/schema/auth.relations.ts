import { relations } from "drizzle-orm";

import { accounts } from "./auth.accounts";
import { sessions } from "./auth.sessions";
import { users } from "./users";

/**
 * Pure auth <-> auth relations only (sessions/accounts belong to a user).
 * The reverse `users` many-side is declared once, combined with every
 * other domain's `users` relations, in `users.relations.ts` — Drizzle's
 * relational query builder only picks up ONE `relations(users, ...)`
 * definition's fields per table at the type level (it merges at runtime,
 * but not in `db.query.users`'s inferred `with` type), so unlike
 * `sessionsRelations`/`accountsRelations` below, the reverse `usersRelations`
 * can't be split across files — don't add another `relations(users, ...)`
 * here even for auth-only fields; extend the one in `users.relations.ts`.
 *
 * `verifications` has no relation here on purpose — Better Auth's
 * verification model isn't linked to `users` by a foreign key (see
 * `auth.verifications.ts`), so there's nothing to declare.
 */

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
