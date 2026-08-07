import {
  createdAt,
  id,
  pgTable,
  references,
  varchar,
  text,
} from "@/db/helpers";
import { index, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * A "thread" is both a top-level post and a reply — `parentId` is what
 * tells them apart (`null` = top-level, set = a reply to that thread).
 * Threads' own flat, one-level reply model, not a nested comment tree.
 */
export const threads = pgTable(
  "threads",
  {
    ...id,
    ...createdAt,

    authorId: references({
      k: "author_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    // Self-reference — built by hand rather than the shared `references()`
    // helper, which takes an already-resolved `PgColumn` and can't take one
    // (`threads.id`) that doesn't exist yet while `threads` itself is still
    // being defined. Drizzle's own escape hatch for this is a lazy
    // `(): AnyPgColumn => ...` getter instead of a resolved column.
    parentId: uuid("parent_id").references((): AnyPgColumn => threads.id, {
      onDelete: "cascade",
    }),

    body: varchar("body", { length: 500 }).notNull(),
    // Postgres `text[]`, not a second table — a thread's images are never
    // queried or joined on independently of the thread itself, so there's
    // nothing a join buys here that an array doesn't already give for
    // free.
    images: text("images").array().notNull().default([]),
  },
  (t) => [
    index("thread__author_id__idx").on(t.authorId),
    index("thread__parent_id__idx").on(t.parentId),
    index("thread__created_at__idx").on(t.createdAt),
  ],
);

export type Thread = typeof threads.$inferSelect;
