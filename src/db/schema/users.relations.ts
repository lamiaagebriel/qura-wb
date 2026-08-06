import { relations } from "drizzle-orm";

import { accounts } from "./auth.accounts";
import { sessions } from "./auth.sessions";
import { follows } from "./users.follows";
import { reports } from "./users.reports";
import { threads } from "./threads";
import { users } from "./users";

/**
 * Relations for the social/profile tables, plus the single combined
 * `usersRelations` (see the comment in `auth.relations.ts` for why it has
 * to live in exactly one place — every domain's reverse `users` relation
 * belongs here, not split into per-domain files).
 */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  // Rows where I'm the one being followed — my followers.
  followers: many(follows, { relationName: "following" }),
  // Rows where I'm the follower — who I follow.
  following: many(follows, { relationName: "follower" }),
  reports: many(reports),
  threads: many(threads),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));
