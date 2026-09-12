import "server-only";

import { and, eq, ilike, isNotNull, notInArray, or } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  getBusinessesConnectedToPlaceIds,
  getFollowerCountsForBusinesses,
  getGooglePlaceIdsForBusinesses,
  getReviewSummariesForBusinesses,
} from "@/lib/business/queries";
import { CITY_CENTER, CITY_LABEL } from "@/lib/city/cities";
import { getCachedLocations } from "@/lib/business/google-place-cache";
import { GooglePlacesError } from "@/lib/google-places/errors";
import { logEvent, logWarning, withTiming } from "@/lib/observability/log";
import { searchGooglePlaces } from "@/lib/google-places/search";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import type { BusinessCategory, CityId } from "@/db/schema";

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
  category?: BusinessCategory,
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
        // Matching `bio` too (not just `username`/`name`) is what makes an
        // intent-style query ("cozy cafe", "quiet place to work") able to
        // surface a Qura business at all — a name-only match would need
        // the business to literally be named after what someone typed,
        // the same gap Google's own Text Search never has since it reads
        // more than a title. Still a plain substring match, not real NLP:
        // it only helps when the business actually wrote that word into
        // its own bio.
        //
        // `category` (set when the typed/tapped query matched a known
        // category's name — see `SearchView`) is OR'd in alongside the
        // text match, not AND'd — a business actually filed under that
        // category comes back even if its name/bio never spells the
        // category out, on top of whatever the plain text match already
        // finds. This is also what makes tapping a category chip and
        // typing that same word by hand behave identically.
        or(
          ilike(schema.users.username, pattern),
          ilike(schema.users.name, pattern),
          ilike(schema.users.bio, pattern),
          category ? eq(schema.businessBlocks.category, category) : undefined,
        ),
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

// Haversine, straight-line distance — good enough for "is this even in
// the right city" (no driving-distance nuance needed, just a sanity
// radius around the city center).
const EARTH_RADIUS_KM = 6371;
function distanceKm(
  a: { lat: number; lng: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = ((b.latitude - a.lat) * Math.PI) / 180;
  const dLng = ((b.longitude - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Google's `locationBias` is a *preference*, not a hard filter — Text
// Search can still return a place well outside the circle if its text
// match is strong enough. A result search is scoped to "your selected
// city, not elsewhere" (never a citywide-only assumption for Qura's own
// data, and Qura's DB side already enforces this with a real `WHERE
// city = ...`), so results outside `MAX_RESULT_DISTANCE_KM` of the
// city's center are dropped after the fact rather than trusted to bias
// alone. Deliberately wider than the bias radius itself — the bias
// nudges Google toward the city, this is the actual cutoff for "did
// that nudge work."
const LOCATION_BIAS_RADIUS_METERS = 20_000;
const MAX_RESULT_DISTANCE_KM = 30;
// The area-search cutoff (see `MapArea` below) is looser than the bias
// radius the caller asks for, same reasoning as the city one: the radius
// nudges Google, this is what actually enforces "in the area you're
// looking at," with enough slack that a result right at the visible
// edge isn't dropped just for rounding.
const AREA_RESULT_SLACK_KM = 3;

/** An explicit map viewport to search instead of the whole city — what
 * "Search this area" on the map sends once the user has panned/zoomed
 * away from the city-wide view. Only ever narrows the Google side (see
 * `searchGoogleCandidates`); Qura's own businesses stay city+text/
 * category-scoped regardless; see `searchQuraCandidates`'s own city
 * predicate — precisely bounding *those* by an arbitrary viewport would
 * need per-business coordinates most Qura listings don't have. */
export type MapArea = { lat: number; lng: number; radiusMeters: number };

/** Never throws — a Google failure degrades to "no Google candidates this
 * page", not a broken search (Phase 4, Part 4/27). Only `GooglePlacesError`
 * (a known, typed failure mode) is caught this way; anything else is a
 * genuine bug and propagates, same as a Qura DB error already would. */
async function searchGoogleCandidates(
  query: string,
  city: CityId,
  pageToken: string | null,
  area?: MapArea,
): Promise<{ results: GooglePlaceSearchResult[]; nextPageToken: string | null }> {
  const cityContext = CITY_LABEL[city];
  // An explicit map viewport overrides the city center entirely — both
  // the bias Google gets and the cutoff applied after — rather than
  // narrowing on top of it, since the two radii answer different
  // questions ("still in the city" vs. "still in the area you're
  // looking at right now") and only one is meaningful for a given
  // request.
  const center = area ?? CITY_CENTER[city];
  const cutoffKm = area
    ? area.radiusMeters / 1000 + AREA_RESULT_SLACK_KM
    : MAX_RESULT_DISTANCE_KM;

  try {
    const { results, nextPageToken } = await searchGooglePlaces({
      // Text context AND a real coordinate bias — the text hint alone
      // ("<query> in <city>") only nudges Google's ranking, it doesn't
      // stop a same-named place in a different city from coming back.
      query: `${query} in ${cityContext}`,
      regionCode: "EG",
      pageSize: GOOGLE_PAGE_SIZE,
      pageToken: pageToken ?? undefined,
      ...(center && {
        latitude: center.lat,
        longitude: center.lng,
        radiusMeters: area?.radiusMeters ?? LOCATION_BIAS_RADIUS_METERS,
      }),
    });

    // Bias isn't a guarantee (see above) — a center is required to
    // actually enforce the cutoff, so a city with none on file
    // (`CITY_CENTER`) falls back to trusting the bias-less text match
    // alone rather than silently dropping every result. An explicit
    // `area` always has a center (the map itself), so this only ever
    // matters for the city-wide path.
    const scoped = center
      ? results.filter(
          (result) =>
            result.location &&
            distanceKm(center, {
              latitude: result.location.latitude,
              longitude: result.location.longitude,
            }) <= cutoffKm,
        )
      : results;

    return { results: scoped, nextPageToken };
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
  category,
  area,
}: {
  query: string;
  cursor: UnifiedSearchCursor;
  city: CityId;
  category?: BusinessCategory;
  area?: MapArea;
}): Promise<{ items: UnifiedSearchResult[]; nextCursor: UnifiedSearchCursor | null }> {
  const totalStart = Date.now();

  const [quraOutcome, googleOutcome] = await Promise.all([
    cursor.quraExhausted
      ? Promise.resolve({ summaries: [] as QuraBusinessSummary[], hasMore: false })
      : withTiming("unified_search_qura_query", { query, city }, () =>
          searchQuraCandidates(
            query,
            cursor.quraOffset,
            cursor.mergedBusinessIds,
            city,
            category,
          ),
        ),
    cursor.googleExhausted
      ? Promise.resolve({ results: [] as GooglePlaceSearchResult[], nextPageToken: null })
      : withTiming("unified_search_google_query", { query, city }, () =>
          searchGoogleCandidates(query, city, cursor.googlePageToken, area),
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

  const { results: mergedResults, mergedBusinessIds, mergedPlaceIds } = mergeSearchCandidates({
    query,
    googleCandidates: googleOutcome.results,
    quraCandidates: quraOutcome.summaries,
    connectedByPlaceId,
    alreadyMergedBusinessIds: new Set(cursor.mergedBusinessIds),
    alreadyMergedPlaceIds: new Set(cursor.mergedPlaceIds),
    signals,
  });

  // A fallback pin location for a connected place whose live Google
  // response didn't come back with a location this page (a different
  // page of results, or Google's Text Search failing/rate-limited
  // entirely) — a plain cache read, never another Google call. See
  // `UnifiedSearchResult.cachedLocation`'s doc comment.
  const placeIdsNeedingCache = mergedResults
    .filter((r) => r.googlePlaceId && !r.googlePlace?.location)
    .map((r) => r.googlePlaceId!);
  const cachedLocations = await getCachedLocations(placeIdsNeedingCache);
  const results: UnifiedSearchResult[] = mergedResults.map((r) => ({
    ...r,
    cachedLocation:
      (r.googlePlaceId && cachedLocations.get(r.googlePlaceId)) || null,
  }));

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
