import "server-only";

import { and, eq, ilike, isNotNull, notInArray, or } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  getBusinessesConnectedToPlaceIds,
  getFollowerCountsForBusinesses,
  getGooglePlaceIdsForBusinesses,
  getReviewSummariesForBusinesses,
} from "@/lib/business/queries";
import { CITY_LABEL } from "@/lib/city/cities";
import { GooglePlacesError } from "@/lib/google-places/errors";
import { logEvent, logWarning, withTiming } from "@/lib/observability/log";
import { searchGooglePlaces } from "@/lib/google-places/search";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import type { CityId } from "@/db/schema";

import { mergeSearchCandidates } from "./merge";
import type { QuraEngagementSignals } from "./ranking";
import type {
  QuraBusinessSummary,
  UnifiedSearchCursor,
  UnifiedSearchResult,
} from "./types";

// Same page size the pre-Phase-4 search used — preserves the existing
// "how much per scroll" feel for an all-Qura result set.
const QURA_PAGE_SIZE = 20;

// Deliberately smaller than Google's own per-request max (20). This is
// candidates for THIS page's merge, not a hard cap on how many Google
// results a user can ever reach — pagination keeps fetching more pages.
// A smaller number here keeps the common case (a query with few or no
// Qura-connected Google matches) cheap: this is the only Google request
// per page, never one per result (Part 19), so the cost that scales with
// page size is exactly one field-mask-limited response, not N.
const GOOGLE_PAGE_SIZE = 10;

/**
 * City-scoped as of Phase 18 (Option 1, confirmed in the Phase 17
 * proposal review): a business without a `business_blocks` row has no
 * recorded city and is excluded — there's nothing to match `city`
 * against, the same "no signal, no fuzzy fallback" principle every other
 * Google/category inclusion rule in this codebase already follows. This
 * is an INNER JOIN (not the old two-query users-then-blocks fetch)
 * specifically so the city predicate can be applied in the same query,
 * not as a post-filter.
 */
async function searchQuraCandidates(
  query: string,
  offset: number,
  excludeIds: string[],
  city: CityId,
): Promise<{ summaries: QuraBusinessSummary[]; hasMore: boolean }> {
  const pattern = `%${query}%`;

  const rows = await db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      image: schema.users.image,
      bio: schema.users.bio,
      category: schema.businessBlocks.category,
      city: schema.businessBlocks.city,
    })
    .from(schema.users)
    .innerJoin(schema.businessBlocks, eq(schema.businessBlocks.businessId, schema.users.id))
    .where(
      and(
        isNotNull(schema.users.ownerId),
        eq(schema.businessBlocks.city, city),
        or(ilike(schema.users.username, pattern), ilike(schema.users.name, pattern)),
        excludeIds.length > 0 ? notInArray(schema.users.id, excludeIds) : undefined,
      ),
    )
    .orderBy(schema.users.username)
    .limit(QURA_PAGE_SIZE + 1)
    .offset(offset);

  const hasMore = rows.length > QURA_PAGE_SIZE;
  const page = rows.slice(0, QURA_PAGE_SIZE);

  // Phase 24: connections no longer ride along on the same row (they're
  // not a column anymore) — one batched follow-up query for this page's
  // businesses, never per-result.
  const googlePlaceIds = await getGooglePlaceIdsForBusinesses(page.map((r) => r.id));
  const summaries: QuraBusinessSummary[] = page.map((r) => ({
    ...r,
    googlePlaceIds: googlePlaceIds.get(r.id) ?? [],
  }));

  return { summaries, hasMore };
}

/** Never throws — a Google failure degrades to "no Google candidates this
 * page", not a broken search (Phase 4, Part 4/27). Only `GooglePlacesError`
 * (a known, typed failure mode) is caught this way; anything else is a
 * genuine bug and propagates, same as a Qura DB error already would. */
async function searchGoogleCandidates(
  query: string,
  cityContext: string,
  pageToken: string | null,
): Promise<{ results: GooglePlaceSearchResult[]; nextPageToken: string | null }> {
  try {
    const { results, nextPageToken } = await searchGooglePlaces({
      // Text context only — no fabricated coordinates. Google's Text
      // Search already understands "<query> in <city>" as a location
      // hint; this is the same idea as `lib/location.ts` never inventing
      // a lat/lng for a description-only Qura location.
      query: `${query} in ${cityContext}`,
      regionCode: "EG",
      pageSize: GOOGLE_PAGE_SIZE,
      pageToken: pageToken ?? undefined,
    });
    return { results, nextPageToken };
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      // Server log only — never surfaced to the user as an error state;
      // Qura results still come back below.
      logWarning("unified_search_google_failed", { query, reason: error.code });
      return { results: [], nextPageToken: null };
    }
    throw error;
  }
}

/**
 * The unified search pipeline (Phase 4): runs Qura's own `ILIKE` search
 * and a Google Text Search concurrently, merges by `googlePlaceId` only
 * (see `merge.ts`), and returns one paginated, deduplicated result list.
 *
 * A Qura DB error is NOT caught here — it propagates exactly as it always
 * did before this phase (the pre-Phase-4 `searchUsersAction` had no
 * try/catch either). Only Google failures degrade gracefully; a real
 * internal/programming error should never be silently swallowed.
 *
 * `city` (Phase 16) is an explicit parameter, not read internally via
 * `getActiveCity()` — the same request-context dependency Phase 15's
 * report flagged as untestable outside a live Next.js request. Obtaining
 * `city` is now the caller's job (`lib/profile/actions/search-users.ts`,
 * a thin "use server" action, calls `getActiveCity()` itself and passes
 * the result in) — this function is a pure domain function over its
 * inputs, callable identically from the real action or an evaluation
 * harness, the same shape `getCategoryDiscovery` already had.
 */
export async function searchUnified({
  query,
  cursor,
  city,
}: {
  query: string;
  cursor: UnifiedSearchCursor;
  city: CityId;
}): Promise<{ items: UnifiedSearchResult[]; nextCursor: UnifiedSearchCursor | null }> {
  const totalStart = Date.now();
  const cityContext = CITY_LABEL[city];

  const [quraOutcome, googleOutcome] = await Promise.all([
    cursor.quraExhausted
      ? Promise.resolve({ summaries: [] as QuraBusinessSummary[], hasMore: false })
      : withTiming("unified_search_qura_query", { query, city }, () =>
          searchQuraCandidates(query, cursor.quraOffset, cursor.mergedBusinessIds, city),
        ),
    cursor.googleExhausted
      ? Promise.resolve({ results: [] as GooglePlaceSearchResult[], nextPageToken: null })
      : withTiming("unified_search_google_query", { query, city }, () =>
          searchGoogleCandidates(query, cityContext, cursor.googlePageToken),
        ),
  ]);

  const connectedByPlaceIdRaw = await getBusinessesConnectedToPlaceIds(
    googleOutcome.results.map((result) => result.placeId),
  );
  // City scope (Phase 18, Option 1) applies here too — a business
  // connected to a Google place but registered in a different city is
  // excluded from the group entirely, not merely ranked lower within it.
  // Filtered locally rather than inside the shared
  // `getBusinessesConnectedToPlaceIds` helper — `category-discovery.ts`
  // also uses that helper and applies this exact same filter itself
  // (Phase 23; Phase 18 originally left it unfiltered there).
  const connectedByPlaceId = new Map(
    [...connectedByPlaceIdRaw.entries()].map(([placeId, businesses]) => [
      placeId,
      businesses
        .filter((business) => business.city === city)
        // `merge.ts` deals in `QuraBusinessSummary` throughout (`googlePlaceIds:
        // string[]`) — a `ConnectedBusinessSummary` here is always scoped to
        // this ONE place already, so it's just that one id, singleton.
        .map((business) => ({ ...business, googlePlaceIds: [business.googlePlaceId] })),
    ]),
  );

  const signals = await withTiming(
    "unified_search_ranking_signals_query",
    { query, city },
    () =>
      getQuraEngagementSignals([
        ...quraOutcome.summaries.map((b) => b.id),
        ...[...connectedByPlaceId.values()].flat().map((b) => b.id),
      ]),
  );

  const { results, mergedBusinessIds, mergedPlaceIds } = mergeSearchCandidates({
    query,
    googleCandidates: googleOutcome.results,
    quraCandidates: quraOutcome.summaries,
    connectedByPlaceId,
    alreadyMergedBusinessIds: new Set(cursor.mergedBusinessIds),
    alreadyMergedPlaceIds: new Set(cursor.mergedPlaceIds),
    signals,
  });

  const quraExhausted = cursor.quraExhausted || !quraOutcome.hasMore;
  const googleExhausted = cursor.googleExhausted || !googleOutcome.nextPageToken;

  const nextCursor: UnifiedSearchCursor | null =
    quraExhausted && googleExhausted
      ? null
      : {
          quraOffset: quraExhausted ? cursor.quraOffset : cursor.quraOffset + QURA_PAGE_SIZE,
          quraExhausted,
          googlePageToken: googleExhausted ? null : googleOutcome.nextPageToken,
          googleExhausted,
          mergedBusinessIds: [...cursor.mergedBusinessIds, ...mergedBusinessIds],
          mergedPlaceIds: [...cursor.mergedPlaceIds, ...mergedPlaceIds],
        };

  logEvent("unified_search_total", {
    query,
    count: results.length,
    durationMs: Date.now() - totalStart,
  });

  return { items: results, nextCursor };
}

/** One small batch of aggregate queries for every business id on this
 * page (never per-result) — same shape as `category-discovery.ts`'s own
 * signal-fetching helper, reusing the identical Phase 13 queries. */
async function getQuraEngagementSignals(
  businessIds: string[],
): Promise<Map<string, QuraEngagementSignals>> {
  const ids = [...new Set(businessIds)];
  if (ids.length === 0) return new Map();

  const [reviewSummaries, followerCounts] = await Promise.all([
    getReviewSummariesForBusinesses(ids),
    getFollowerCountsForBusinesses(ids),
  ]);

  return new Map(
    ids.map((id) => [
      id,
      {
        reviewCount: reviewSummaries.get(id)?.reviewCount ?? 0,
        averageRating: reviewSummaries.get(id)?.averageRating ?? null,
        followerCount: followerCounts.get(id) ?? 0,
      },
    ]),
  );
}
