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
import { places } from "./places";

export const postType = pgEnum("post_type", POST_TYPES);

/** `under_review`: hidden, edited by its author since, waiting for an admin. */
export const POST_STATUSES = ["visible", "hidden", "under_review"] as const;
export const postStatus = pgEnum("post_status", POST_STATUSES);

/**
 * Everything people share in a place — offers, announcements, questions… —
 * in one table, told apart by `type` (`lib/posts.ts`).
 * - `createdById`: who wrote it (always set; edits / deletes it). Accounts
 *   are anonymized, never deleted, so this refuses a delete.
 * - `businessId`: set when it's posted as one of their businesses; the
 *   post then shows as the business. Which types each can post:
 *   `typesFor` (`lib/posts.ts`).
 * - `parentId`: set on a reply (flat, one level). A reply copies its
 *   parent's `type` and place; only top-level posts are listed.
 * - `status`: hidden ones (a report) show only to their author; why and by
 *   whom is in the report ticket and `history`.
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
      .references(() => users.id, { onDelete: "restrict" }),
    businessId: uuid().references(() => businesses.id, { onDelete: "cascade" }),
    parentId: uuid().references((): AnyPgColumn => posts.id, {
      onDelete: "cascade",
    }),
    type: postType().notNull().default("general"),
    body: varchar({ length: 500 }).notNull(),
    /** Its place: it shows there and in every place above it. */
    placeId: uuid()
      .notNull()
      .references(() => places.id, { onDelete: "restrict" }),
    /** Its type's own fields, checked by `POST_DATA` (`lib/posts.ts`). */
    data: jsonb().$type<AnyPostData>().notNull().default({}),
    status: postStatus().notNull().default("visible"),
  },
  (t) => [
    // A type's list in a place, newest first (the home sections and pages).
    index("posts_place_type_created_at_idx").on(t.placeId, t.type, t.createdAt),
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
