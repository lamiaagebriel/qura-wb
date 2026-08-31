import { createdAt, id, pgTable, references } from "@/db/helpers";
import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { threads } from "./threads";
import { users } from "./users";

/**
 * A private bookmark — "save this for later," never shown as a public
 * count or signal the way `thread_votes` is. Replaces the old public
 * "like" entirely: this app's actual public engagement signal is the
 * helpful/not-helpful vote (`threads.votes.ts`), not a heart count.
 */
export const threadSaves = pgTable(
  "thread_saves",
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
  },
  (t) => [
    uniqueIndex("thread_save__user_id__thread_id__idx").on(t.userId, t.threadId),
    index("thread_save__thread_id__idx").on(t.threadId),
    index("thread_save__user_id__idx").on(t.userId),
  ],
);

export type ThreadSave = typeof threadSaves.$inferSelect;
