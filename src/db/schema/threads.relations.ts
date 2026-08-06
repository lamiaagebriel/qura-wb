import { relations } from "drizzle-orm";

import { threadLikes } from "./threads.likes";
import { threads } from "./threads";
import { users } from "./users";

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(users, {
    fields: [threads.authorId],
    references: [users.id],
  }),
  parent: one(threads, {
    fields: [threads.parentId],
    references: [threads.id],
    relationName: "replies",
  }),
  replies: many(threads, { relationName: "replies" }),
  likes: many(threadLikes),
}));

export const threadLikesRelations = relations(threadLikes, ({ one }) => ({
  thread: one(threads, {
    fields: [threadLikes.threadId],
    references: [threads.id],
  }),
  user: one(users, {
    fields: [threadLikes.userId],
    references: [users.id],
  }),
}));
