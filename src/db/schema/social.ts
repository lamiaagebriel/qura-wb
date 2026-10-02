import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgTable,
  primaryKey,
  smallint,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { id, timestamps } from "../helpers";
import { users } from "./auth";
import { businesses } from "./businesses";

/**
 * A user's review of a business: 1–5 stars and optional text. One per user
 * per business — writing again edits it. Not of a business they own or
 * added (checked by the action).
 */
export const reviews = pgTable(
  "reviews",
  {
    ...id,
    ...timestamps,
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    authorId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: smallint().notNull(),
    text: varchar({ length: 1000 }).notNull().default(""),
  },
  (t) => [
    uniqueIndex("reviews_business_id_author_id_idx").on(
      t.businessId,
      t.authorId,
    ),
    // Newest first on a business's page.
    index("reviews_business_id_created_at_idx").on(t.businessId, t.createdAt),
    index("reviews_author_id_idx").on(t.authorId),
    check("reviews_rating_check", sql`${t.rating} between 1 and 5`),
  ],
);

/** A user following a business. */
export const follows = pgTable(
  "follows",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    businessId: uuid()
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.businessId] }),
    // Follower counts.
    index("follows_business_id_idx").on(t.businessId),
  ],
);
