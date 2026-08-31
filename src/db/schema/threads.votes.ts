import { createdAt, id, pgTable, references } from "@/db/helpers";
import { index, smallint, uniqueIndex } from "drizzle-orm/pg-core";

import { threads } from "./threads";
import { users } from "./users";

/**
 * "Is this post actually useful to the city?" — separate from the
 * private `thread_saves` bookmark (which just means "save this for
 * later," never a public signal). One row per (user, thread): `value`
 * is `1` (helpful) or `-1` (not helpful), never `0` — taking your vote
 * back deletes the row instead of storing a zero. See
 * `THREAD_UNHELPFUL_*` in `lib/threads/queries.ts` for how these roll up
 * into a thread getting marked unhelpful.
 */
export const threadVotes = pgTable(
  "thread_votes",
  {
    ...id,
    ...createdAt,

    userId: references({
      k: "user_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    threadId: references({
      k: "thread_id",
      ref: threads.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    value: smallint("value").notNull(),
  },
  (t) => [
    uniqueIndex("thread_vote__user_id__thread_id__idx").on(t.userId, t.threadId),
    index("thread_vote__thread_id__idx").on(t.threadId),
    index("thread_vote__user_id__idx").on(t.userId),
  ],
);

export type ThreadVote = typeof threadVotes.$inferSelect;
