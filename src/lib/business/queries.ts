import "server-only";

import { and, avg, count, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import type { BusinessCategory, CityId } from "@/db/schema";

/** Every business profile a real account controls, newest first — the
 * settings list and the composer's "post as" picker both need exactly
 * this. `eq(ownerId, ownerId)` alone already implies "this is a
 * business" (a real account's `ownerId` is always null), so there's
 * nothing else to check. */
export async function getMyBusinesses(ownerId: string) {
  return db.query.users.findMany({
    where: eq(schema.users.ownerId, ownerId),
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

/** A single owned business, for the edit page — `null` if it doesn't
 * exist or isn't owned by `ownerId`, which the caller treats as "not
 * found" either way rather than distinguishing the two. */
export async function getMyBusinessById(id: string, ownerId: string) {
  return db.query.users.findFirst({
    where: and(eq(schema.users.id, id), eq(schema.users.ownerId, ownerId)),
  });
}

/** `[yourOwnId, ...everyBusinessYouOwn]` — the full set of author ids a
 * thread action should treat as "yours" for an ownership check, since a
 * thread posted "as" a business is authored by that business's row, not
 * by you directly. */
export async function getOwnedAuthorIds(ownerId: string): Promise<string[]> {
  const businesses = await getMyBusinesses(ownerId);
  return [ownerId, ...businesses.map((b) => b.id)];
}

/** The category-specific block for one business — `null` if it hasn't
 * set one (a business isn't required to pick a category). Used both by
 * the edit form (to prefill) and the public profile page (to display
 * it), same row either way. */
export async function getBusinessBlock(businessId: string) {
  return db.query.businessBlocks.findFirst({
    where: eq(schema.businessBlocks.businessId, businessId),
  });
}

/** Every business that's set the given category in the given city,
 * newest first — the `/categories/[category]` browse page. Joins through
 * `business_blocks` rather than `users` since "has this category" (and
 * "is in this city") only exist on the block row. */
export async function getBusinessesByCategory(
  category: BusinessCategory,
  city: CityId,
) {
  return db.query.businessBlocks.findMany({
    where: and(
      eq(schema.businessBlocks.category, category),
      eq(schema.businessBlocks.city, city),
    ),
    with: { business: true },
    orderBy: (blocks, { desc }) => [desc(blocks.createdAt)],
  });
}

const REVIEWS_PAGE_SIZE = 20;

/** One page of reviews on one business, newest first, with the
 * reviewing account's public info attached — the Reviews tab's list,
 * paginated the same numeric-offset way every other list in the app is
 * (see `paginatedThreads` in `lib/threads/queries.ts`). */
export async function getBusinessReviews(businessId: string, cursor = 0) {
  const rows = await db.query.businessReviews.findMany({
    where: eq(schema.businessReviews.businessId, businessId),
    with: { author: true },
    orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    limit: REVIEWS_PAGE_SIZE + 1,
    offset: cursor,
  });

  const hasMore = rows.length > REVIEWS_PAGE_SIZE;
  const items = rows.slice(0, REVIEWS_PAGE_SIZE);
  return { items, nextCursor: hasMore ? cursor + REVIEWS_PAGE_SIZE : null };
}

/** Average rating + review count for one business — `average` is `null`
 * with zero reviews rather than `0`, since "no reviews yet" and "every
 * review gave it 0 stars" (impossible, but still) are different things
 * to show. */
export async function getBusinessRatingSummary(businessId: string) {
  const [row] = await db
    .select({
      average: avg(schema.businessReviews.rating),
      count: count(schema.businessReviews.rating),
    })
    .from(schema.businessReviews)
    .where(eq(schema.businessReviews.businessId, businessId));
  return {
    average: row.average ? Number(row.average) : null,
    count: row.count,
  };
}

/** The signed-in viewer's own review of this business, if they've left
 * one — prefills the write-a-review form as an edit instead of a blank
 * create, and is how "you already reviewed this" is known at all (the
 * DB's unique `(businessId, authorId)` index is what actually enforces
 * one review per person; this is just reading that same fact back). */
export async function getMyReview(businessId: string, authorId: string) {
  return db.query.businessReviews.findFirst({
    where: and(
      eq(schema.businessReviews.businessId, businessId),
      eq(schema.businessReviews.authorId, authorId),
    ),
  });
}
