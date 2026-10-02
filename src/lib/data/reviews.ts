import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { reviews, users } from "@/db/schema";
import type { Review, ReviewSummary } from "@/lib/reviews";

/** A business's reviews, newest first, with each author's name and photo. */
export async function getReviews(businessId: string): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      author: {
        name: users.name,
        username: users.username,
        avatarUrl: users.image,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(eq(reviews.businessId, businessId))
    .orderBy(desc(reviews.createdAt));
  // `rating` is 1–5 (checked by the database).
  return rows as Review[];
}

/** Count, average and star breakdown, computed by the database. */
export async function getReviewSummary(
  businessId: string,
): Promise<ReviewSummary> {
  const rows = await db
    .select({ rating: reviews.rating, count: count() })
    .from(reviews)
    .where(eq(reviews.businessId, businessId))
    .groupBy(reviews.rating);

  const byStars: ReviewSummary["byStars"] = [0, 0, 0, 0, 0];
  let total = 0;
  let reviewCount = 0;
  for (const row of rows) {
    byStars[5 - row.rating] = row.count;
    total += row.rating * row.count;
    reviewCount += row.count;
  }
  return {
    count: reviewCount,
    average: reviewCount ? total / reviewCount : 0,
    byStars,
  };
}

/** The review this user wrote for this business, if any (to edit it). */
export async function getMyReview(businessId: string, userId: string) {
  const [review] = await db
    .select({ rating: reviews.rating, text: reviews.text })
    .from(reviews)
    .where(
      and(eq(reviews.businessId, businessId), eq(reviews.authorId, userId)),
    )
    .limit(1);
  return review;
}
