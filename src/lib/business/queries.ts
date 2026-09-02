import "server-only";

import { and, avg, count, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";
import type { BusinessCategory, CityId } from "@/db/schema";
import {
  getCachedGooglePlace,
  type GooglePlaceCacheResult,
} from "@/lib/business/google-place-cache";

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

/**
 * Phase 21's same-user/same-place dedup check — does `ownerId` already
 * own a business connected to this exact `googlePlaceId`? A place is
 * only ever connected to a handful of businesses at most, so one
 * "who's connected" query filtered in JS is simpler (and just as cheap)
 * than a three-way join.
 *
 * `null` means "not yet" — the conversion flow's UI treats that as "show
 * the creation form"; a non-null result means "redirect there instead of
 * creating a duplicate." Unaffected by Phase 24's move to multi-branch
 * connections (`business_google_places`): this only ever asks about one
 * specific place, never "does this business have any connection at all."
 */
export async function getMyBusinessConnectedToPlace(
  ownerId: string,
  googlePlaceId: string,
) {
  const rows = await db.query.businessGooglePlaces.findMany({
    where: eq(schema.businessGooglePlaces.googlePlaceId, googlePlaceId),
    with: {
      business: { columns: { id: true, username: true, ownerId: true } },
    },
  });
  const mine = rows.find((row) => row.business.ownerId === ownerId);
  return mine ? { id: mine.business.id, username: mine.business.username } : null;
}

/** Every Google Place a business is connected to (Phase 24 — multiple
 * branches), oldest connection first (a business's very first Google
 * connection is treated as its "primary" branch wherever exactly one has
 * to be picked, e.g. `merge.ts`'s free-text search grouping). `[]` for a
 * business with no connections, never `null` — callers that need to
 * distinguish "no block yet" from "block, zero connections" already have
 * the block row itself. */
export async function getBusinessGooglePlaces(businessId: string) {
  return db.query.businessGooglePlaces.findMany({
    where: eq(schema.businessGooglePlaces.businessId, businessId),
    orderBy: (rows, { asc }) => [asc(rows.createdAt)],
  });
}

/** Every Google Place id each of the given businesses is connected to, in
 * ONE query — one entry per business that has at least one connection, no
 * entry at all for a business with none (same "missing = zero" contract
 * as `getReviewSummariesForBusinesses`/`getFollowerCountsForBusinesses`).
 * Used wherever ranking needs "connected vs. not" as a plain
 * `map.has(id)` (category discovery's tier 1/2 split) without a second,
 * separate boolean-only query. */
export async function getGooglePlaceIdsForBusinesses(
  businessIds: string[],
): Promise<Map<string, string[]>> {
  if (businessIds.length === 0) return new Map();

  const rows = await db
    .select({
      businessId: schema.businessGooglePlaces.businessId,
      googlePlaceId: schema.businessGooglePlaces.googlePlaceId,
    })
    .from(schema.businessGooglePlaces)
    .where(inArray(schema.businessGooglePlaces.businessId, businessIds));

  const byBusinessId = new Map<string, string[]>();
  for (const row of rows) {
    const existing = byBusinessId.get(row.businessId);
    if (existing) existing.push(row.googlePlaceId);
    else byBusinessId.set(row.businessId, [row.googlePlaceId]);
  }
  return byBusinessId;
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
    // Explicit columns — this feeds a public browse page, so no
    // `email`/`role`/`status`/`ownerId` leave the server (same fix
    // Phase 4 applied to search's equivalent query).
    with: {
      business: {
        columns: { id: true, name: true, username: true, image: true },
      },
    },
    orderBy: (blocks, { desc }) => [desc(blocks.createdAt)],
  });
}

export type ConnectedBusinessSummary = {
  id: string;
  username: string;
  name: string;
  image: string | null;
  bio: string | null;
  category: BusinessCategory | null;
  city: CityId | null;
  // Always the ONE specific place this summary was looked up for — never
  // "this business's only connection" (Phase 24: a business may have
  // several). Every summary here comes from `getBusinessesConnectedToPlaceIds`,
  // which is already scoped per place id, so this is never ambiguous.
  googlePlaceId: string;
};

/** Every Qura business connected to any of the given Google place ids,
 * grouped by place id — one query for all of them (Phase 4/5's
 * "never one query per place" rule), never an arbitrary single pick per
 * place (Phase 5: several businesses can share one place, and none may
 * be silently dropped). Phase 24: also never an arbitrary pick per
 * BUSINESS — a business with several branches, more than one of which
 * matches this page's Google candidates, appears once per matching
 * place, not collapsed to one. Shared by `lib/search/unified-search.ts`
 * and `lib/search/category-discovery.ts` — both need exactly this
 * lookup. */
export async function getBusinessesConnectedToPlaceIds(
  placeIds: string[],
): Promise<Map<string, ConnectedBusinessSummary[]>> {
  if (placeIds.length === 0) return new Map();

  const rows = await db.query.businessGooglePlaces.findMany({
    where: inArray(schema.businessGooglePlaces.googlePlaceId, placeIds),
    with: {
      business: {
        columns: { id: true, name: true, username: true, image: true, bio: true },
        with: {
          block: { columns: { category: true, city: true } },
        },
      },
    },
  });

  const byPlaceId = new Map<string, ConnectedBusinessSummary[]>();
  for (const row of rows) {
    const summary: ConnectedBusinessSummary = {
      id: row.business.id,
      username: row.business.username,
      name: row.business.name,
      image: row.business.image,
      bio: row.business.bio,
      category: row.business.block?.category ?? null,
      city: row.business.block?.city ?? null,
      googlePlaceId: row.googlePlaceId,
    };
    const existing = byPlaceId.get(row.googlePlaceId);
    if (existing) existing.push(summary);
    else byPlaceId.set(row.googlePlaceId, [summary]);
  }
  return byPlaceId;
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

/** Review count + average rating for each of the given businesses, in
 * ONE query (`GROUP BY businessId`) — Phase 13's ranking needs this for
 * a whole page of results at once, never per-result. A business with no
 * reviews simply has no entry in the returned map (not a zero-valued
 * one) — callers treat a missing entry as "0 reviews, no rating", the
 * same "no reviews yet" vs "0 average" distinction
 * `getBusinessRatingSummary` already draws for a single business. */
export async function getReviewSummariesForBusinesses(
  businessIds: string[],
): Promise<Map<string, { reviewCount: number; averageRating: number | null }>> {
  if (businessIds.length === 0) return new Map();

  const rows = await db
    .select({
      businessId: schema.businessReviews.businessId,
      reviewCount: count(schema.businessReviews.rating),
      averageRating: avg(schema.businessReviews.rating),
    })
    .from(schema.businessReviews)
    .where(inArray(schema.businessReviews.businessId, businessIds))
    .groupBy(schema.businessReviews.businessId);

  return new Map(
    rows.map((row) => [
      row.businessId,
      {
        reviewCount: row.reviewCount,
        averageRating: row.averageRating ? Number(row.averageRating) : null,
      },
    ]),
  );
}

/** Follower count for each of the given businesses, in ONE query — same
 * "batched, not per-result" reasoning as `getReviewSummariesForBusinesses`.
 * A business with no followers has no entry in the map. */
export async function getFollowerCountsForBusinesses(
  businessIds: string[],
): Promise<Map<string, number>> {
  if (businessIds.length === 0) return new Map();

  const rows = await db
    .select({
      followingId: schema.follows.followingId,
      followerCount: count(),
    })
    .from(schema.follows)
    .where(inArray(schema.follows.followingId, businessIds))
    .groupBy(schema.follows.followingId);

  return new Map(rows.map((row) => [row.followingId, row.followerCount]));
}

/**
 * Google-owned enrichment for a business's connected place, through the
 * Phase 7 cache — `null` ONLY means "not connected at all"
 * (`googlePlaceId` is null). Once connected, the result is always one of
 * `getCachedGooglePlace`'s three states (`fresh`/`stale`/`unavailable`),
 * never collapsed back to `null` — a Google failure changes what's
 * displayed, never whether the business is considered connected. Shared
 * by the business-owner settings page and the public profile page so
 * both get the same cache-aware behavior for free.
 *
 * `languageCode` is optional — pass the viewer's active locale so Google
 * localizes what it can (mainly `openingHours.weekdayDescriptions`)
 * itself, rather than Qura hardcoding weekday names.
 */
export async function getBusinessGooglePlaceDetails(
  googlePlaceId: string | null,
  languageCode?: string,
): Promise<GooglePlaceCacheResult | null> {
  if (!googlePlaceId) return null;
  return getCachedGooglePlace(googlePlaceId, languageCode);
}

/** Phase 24 — the plural form: every one of a business's connected
 * branches, each resolved through the same Phase 7 cache
 * `getBusinessGooglePlaceDetails` already uses. `[]` for a business with
 * no connections (never a reason to skip the query — most businesses
 * have none, and `getBusinessGooglePlaces` already returns `[]` cheaply
 * for that case). Shared by the business-owner settings page, the
 * account page, and the public profile page so all three get the same
 * cache-aware per-branch behavior for free. */
export async function getBusinessGooglePlaceResults(
  businessId: string,
  languageCode?: string,
): Promise<{ googlePlaceId: string; result: GooglePlaceCacheResult }[]> {
  const rows = await getBusinessGooglePlaces(businessId);
  return Promise.all(
    rows.map(async (row) => ({
      googlePlaceId: row.googlePlaceId,
      result: await getCachedGooglePlace(row.googlePlaceId, languageCode),
    })),
  );
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
