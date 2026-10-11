import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uuid,
  varchar,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import { POST_TYPES, type AnyPostData } from "@/lib/posts";

import { id, timestamps } from "../helpers";
import { users } from "./auth";
import { businesses } from "./businesses";

export const postType = pgEnum("post_type", POST_TYPES);

/**
 * Everything people share in a city — offers, announcements, questions… —
 * in one table, told apart by `type` (`lib/posts.ts`).
 * - `createdById`: the user who wrote it (always set; edits / deletes it).
 * - `businessId`: set when it's posted as one of their businesses; the
 *   post then shows as the business. Which types each can post:
 *   `typesFor` (`lib/posts.ts`).
 * - `parentId`: set on a reply (flat, one level). A reply copies its
 *   parent's `type` and `city`, which only top-level posts are listed by.
 * - `data`: the fields of its type (an offer's price, last day…), one
 *   JSON object — a new field is a schema change in code, not a migration.
 */
export const posts = pgTable(
  "posts",
  {
    ...id,
    ...timestamps,
    createdById: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid().references(() => businesses.id, { onDelete: "cascade" }),
    parentId: uuid().references((): AnyPgColumn => posts.id, {
      onDelete: "cascade",
    }),
    type: postType().notNull().default("general"),
    body: varchar({ length: 500 }).notNull(),
    /** A city slug (`lib/cities.ts`), like `business_locations.city`. */
    city: varchar({ length: 40 }).notNull(),
    /** Its type's own fields, checked by `POST_DATA` (`lib/posts.ts`). */
    data: jsonb().$type<AnyPostData>().notNull().default({}),
  },
  (t) => [
    // A type's list in a city, newest first (the home sections and pages).
    index("posts_city_type_created_at_idx").on(t.city, t.type, t.createdAt),
    index("posts_business_id_created_at_idx").on(t.businessId, t.createdAt),
    index("posts_parent_id_idx").on(t.parentId),
    index("posts_created_by_id_idx").on(t.createdById),
  ],
);

export type PostRow = typeof posts.$inferSelect;

/**
 * "Was this useful?" — the public signal: `1` helpful, `-1` not. Taking
 * your vote back deletes the row.
 */
export const postVotes = pgTable(
  "post_votes",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    value: smallint().notNull(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    index("post_votes_post_id_idx").on(t.postId),
    check("post_votes_value_check", sql`${t.value} in (-1, 1)`),
  ],
);

/** A private bookmark (Profile → Saved); never shown to anyone else. */
export const postSaves = pgTable(
  "post_saves",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.postId] }),
    index("post_saves_post_id_idx").on(t.postId),
  ],
);
