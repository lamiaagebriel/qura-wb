import { relations } from "drizzle-orm";

import { threadSaves } from "./threads.saves";
import { threadVotes } from "./threads.votes";
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
  saves: many(threadSaves),
  votes: many(threadVotes),
}));

export const threadSavesRelations = relations(threadSaves, ({ one }) => ({
  thread: one(threads, {
    fields: [threadSaves.threadId],
    references: [threads.id],
  }),
  user: one(users, {
    fields: [threadSaves.userId],
    references: [users.id],
  }),
}));

export const threadVotesRelations = relations(threadVotes, ({ one }) => ({
  thread: one(threads, {
    fields: [threadVotes.threadId],
    references: [threads.id],
  }),
  user: one(users, {
    fields: [threadVotes.userId],
    references: [users.id],
  }),
}));
