import { createdAt, id, pgTable, references } from "@/db/helpers";
import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { threads } from "./threads";
import { users } from "./users";

export const threadLikes = pgTable(
  "thread_likes",
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
    uniqueIndex("thread_like__user_id__thread_id__idx").on(t.userId, t.threadId),
    index("thread_like__thread_id__idx").on(t.threadId),
    index("thread_like__user_id__idx").on(t.userId),
  ],
);

export type ThreadLike = typeof threadLikes.$inferSelect;
