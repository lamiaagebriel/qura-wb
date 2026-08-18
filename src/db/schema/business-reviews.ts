import { createdAt, id, pgTable, references, updatedAt } from "@/db/helpers";
import { index, integer, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * One review per (business, author) pair — writing a second review for
 * the same business updates the first rather than piling up, same as
 * "you can only follow someone once". `authorId` is always a real
 * account, never a business (businesses can't sign in to write one, and
 * the write path never lets one review itself or another business).
 */
export const businessReviews = pgTable(
  "business_reviews",
  {
    ...id,
    ...createdAt,
    ...updatedAt,

    businessId: references({
      k: "business_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),
    authorId: references({
      k: "author_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),

    rating: integer("rating").notNull(),
    body: varchar("body", { length: 500 }),
  },
  (t) => [
    uniqueIndex("business_review__business_id__author_id__idx").on(
      t.businessId,
      t.authorId,
    ),
    index("business_review__business_id__idx").on(t.businessId),
    index("business_review__author_id__idx").on(t.authorId),
  ],
);

export type BusinessReview = typeof businessReviews.$inferSelect;
