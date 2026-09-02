import { relations } from "drizzle-orm";

import { accounts } from "./auth.accounts";
import { businessBlocks } from "./business-blocks";
import { businessGooglePlaces } from "./business-google-places";
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

export const usersRelations = relations(users, ({ one, many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  // Rows where I'm the one being followed — my followers.
  followers: many(follows, { relationName: "following" }),
  // Rows where I'm the follower — who I follow.
  following: many(follows, { relationName: "follower" }),
  reports: many(reports),
  threads: many(threads),
  // Self-relation for business profiles: the real account that controls
  // this row (set only when `ownerId` is non-null, i.e. this row is a
  // business), and — from the other side — every business profile a
  // real account controls.
  owner: one(users, {
    fields: [users.ownerId],
    references: [users.id],
    relationName: "businesses",
  }),
  businesses: many(users, { relationName: "businesses" }),
  // A business row's own category block (one-to-one — `businessId` is
  // unique on `business_blocks`). `undefined`/missing for a real account
  // (`ownerId === null`) or a business that hasn't set a category yet.
  block: one(businessBlocks, {
    fields: [users.id],
    references: [businessBlocks.businessId],
  }),
  // Phase 24 — every Google Place branch this business is connected to.
  googlePlaces: many(businessGooglePlaces),
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
