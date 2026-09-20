import {
  createdAt,
  id,
  pgTable,
  references,
  varchar,
  text,
} from "@/db/helpers";
import { index, pgEnum, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

import { cityEnum } from "./cities";
import { users } from "./users";

// What kind of post this is — purely a labeling/browsing aid (see
// `lib/threads/categories.ts` for the icon/label each maps to), not
// something the app enforces any different behavior around. "general" is
// the default for anything that isn't specifically one of the others.
export const THREAD_CATEGORIES = [
  "general",
  "together",
  "experience",
  "question",
  "offer",
  "announcement",
  "alert",
] as const;
export const threadCategoryEnum = pgEnum("thread__category", THREAD_CATEGORIES);
export type ThreadCategory = (typeof THREAD_CATEGORIES)[number];

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
    // This thread's own S3 image-key ancestry: its own `id` for a
    // top-level thread, or `{parent's imagePath}/{this thread's id}` for
    // a reply — reserved (`lib/threads/image-path.ts`) BEFORE the row
    // exists, since it has to be known while generating presigned upload
    // URLs, not just at insert time. Every nested reply's images end up
    // stored under a key that's literally prefixed by this value, which
    // is the whole point: deleting a thread's entire subtree of images
    // (however deep) is one S3 prefix list+delete keyed on THIS column
    // (`lib/threads/actions/delete.ts`), never a recursive walk of the
    // reply tree. `NOT NULL` — every insert site (`createThreadAction`,
    // `db/seed.ts`) reserves/computes a real value; there's no path that
    // creates a thread without one.
    imagePath: text("image_path").notNull(),
    // Which city's feed this shows up in — set once, at creation, from
    // whichever city was active (`getActiveCity`) at the time. Only
    // top-level threads are ever filtered by it (`getFeedThreads`); a
    // reply still gets a value (the column is `NOT NULL`) but nothing
    // reads it, since a reply is only ever seen from its parent's own
    // thread page, not a city-scoped list.
    city: cityEnum("city").notNull().default("aswan"),
    // Same "reply gets a value nothing reads" story as `city` — only a
    // top-level thread's category is ever shown or filterable
    // (`ThreadCard`, `getFeedThreads`'s optional category filter).
    category: threadCategoryEnum("category").notNull().default("general"),
  },
  (t) => [
    index("thread__author_id__idx").on(t.authorId),
    index("thread__parent_id__idx").on(t.parentId),
    index("thread__created_at__idx").on(t.createdAt),
    index("thread__city__idx").on(t.city),
    index("thread__category__idx").on(t.category),
  ],
);

export type Thread = typeof threads.$inferSelect;
