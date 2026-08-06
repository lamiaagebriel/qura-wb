import { createdAt, id, pgTable, references } from "@/db/helpers";
import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * One row per follow relationship: `followerId` follows `followingId`.
 * Directional and asymmetric on purpose (Threads-style follow, not a
 * mutual "friend" edge) — "followers" and "following" are just this same
 * table queried from either side.
 */
export const follows = pgTable(
  "follows",
  {
    ...id,
    ...createdAt,

    followerId: references({
      k: "follower_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    followingId: references({
      k: "following_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
  },
  (t) => [
    uniqueIndex("follow__follower_id__following_id__idx").on(
      t.followerId,
      t.followingId,
    ),
    // Postgres doesn't auto-index foreign key columns — both sides get
    // queried independently ("who follows me" vs "who do I follow"), and
    // the composite unique index above only covers lookups that already
    // know both ids.
    index("follow__follower_id__idx").on(t.followerId),
    index("follow__following_id__idx").on(t.followingId),
  ],
);

export type Follow = typeof follows.$inferSelect;
