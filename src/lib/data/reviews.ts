import "server-only";

import { and, asc, count, desc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { businessReviews as reviews, users } from "@/db/schema";
import type { Review, ReviewSort, ReviewSummary } from "@/lib/reviews";

/** What the public sees (rule 13, 17): visible reviews by people who aren't suspended. */
const publicReviews = (businessId: string) =>
  and(eq(reviews.businessId, businessId), eq(reviews.status, "visible"), ne(users.status, "suspended"));

/**
 * A business's reviews (`sort`: newest first by default, or by stars —
 * newest first among equals), with each author's name and photo. The
 * viewer's own one (`userId`) comes first, marked `mine`. `stars`: only
 * reviews with that many stars.
 */
export async function getReviews(
  businessId: string,
  userId?: string,
  stars?: number,
  sort: ReviewSort = "newest",
): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      authorId: reviews.authorId,
      author: {
        name: users.name,
        username: users.username,
        avatarUrl: users.image,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(
      and(
        publicReviews(businessId),
        stars ? eq(reviews.rating, stars) : undefined,
      ),
    )
    .orderBy(
      ...(sort === "highest"
        ? [desc(reviews.rating)]
        : sort === "lowest"
          ? [asc(reviews.rating)]
          : []),
      desc(reviews.createdAt),
    );
  // `rating` is 1–5 (checked by the database). Ids stay on the server.
  const list = rows.map(({ authorId, ...review }) => ({
    ...review,
    mine: !!userId && authorId === userId,
  })) as Review[];
  return [...list.filter((r) => r.mine), ...list.filter((r) => !r.mine)];
}

/** Count, average and star breakdown, computed by the database. */
export async function getReviewSummary(
  businessId: string,
): Promise<ReviewSummary> {
  const rows = await db
    .select({ rating: reviews.rating, count: count() })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.authorId))
    .where(publicReviews(businessId))
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
    .select({ rating: reviews.rating, text: reviews.text, status: reviews.status })
    .from(reviews)
    .where(
      and(eq(reviews.businessId, businessId), eq(reviews.authorId, userId)),
    )
    .limit(1);
  return review;
}
