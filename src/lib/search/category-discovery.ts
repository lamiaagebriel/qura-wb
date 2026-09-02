import "server-only";

import { and, eq, notInArray } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  getBusinessesConnectedToPlaceIds,
  getFollowerCountsForBusinesses,
  getGooglePlaceIdsForBusinesses,
  getReviewSummariesForBusinesses,
  type ConnectedBusinessSummary,
} from "@/lib/business/queries";
import { mapGoogleTypesToQuraCategories } from "@/lib/business/google-category-mapping";
import { CATEGORY_META } from "@/lib/categories";
import { CITY_LABEL } from "@/lib/city/cities";
import { logEvent, logWarning, withTiming } from "@/lib/observability/log";
import { GooglePlacesError } from "@/lib/google-places/errors";
import { searchGooglePlaces } from "@/lib/google-places/search";
import type { GooglePlaceSearchResult } from "@/lib/google-places/types";
import {
  rankGoogleAnchoredResults,
  rankQuraResults,
  type QuraEngagementSignals,
} from "./ranking";
import type { BusinessCategory, CityId } from "@/db/schema";

// Same page-size reasoning as `unified-search.ts` — one field-mask-limited
// Google request per page, never one per candidate place.
const QURA_PAGE_SIZE = 20;
const GOOGLE_PAGE_SIZE = 20;

/**
 * Why a business appears in this category's discovery list — the part
 * that keeps "Google expands discovery" from ever reading as "Google
 * redefined this business's category":
 *
 * - `"category"`: `business_blocks.category` actually equals this
 *   category. The authoritative, pre-existing reason — this business
 *   would appear here with or without any Google connection.
 * - `"google_type"`: this business's *own* Qura category is something
 *   else (or unset) — it's here only because its connected Google
 *   place's `types` map to this category
 *   (`mapGoogleTypesToQuraCategories`). `business_blocks.category` is
 *   NEVER written by this module; the business's real Qura
 *   classification is completely unaffected by appearing here this way.
 */
export type CategoryDiscoveryBusiness = Omit<ConnectedBusinessSummary, "googlePlaceId"> & {
  // Phase 24: a business may hold several Google Place connections at
  // once (branches), so this is every one of them, not a single nullable
  // id — `[]` means not connected at all. For a `kind: "both"` group's
  // businesses (rule B/C), this is always exactly the one place that
  // group is anchored on, not that business's unrelated other branches
  // (if any) — this list is scoped to "how is this business relevant to
  // THIS result", same as everywhere else in this module.
  googlePlaceIds: string[];
  via: "category" | "google_type";
  // Only ever populated for `kind: "qura"` — the block's category-specific
  // `data` blob, needed for the same cuisine/specialty preview text the
  // category page has always shown. A `"both"` result's businesses show
  // the Google place's address instead (the page decides that).
  previewData: Record<string, unknown> | null;
};

export type CategoryDiscoveryResult =
  | { kind: "qura"; business: CategoryDiscoveryBusiness }
  | {
      kind: "both";
      businesses: CategoryDiscoveryBusiness[];
      place: GooglePlaceSearchResult;
    }
  | { kind: "google"; place: GooglePlaceSearchResult };

/**
 * Opaque to the frontend, same contract as `UnifiedSearchCursor`
 * (Phase 4/5) — kept as its own named type rather than reusing that one
 * literally, so a caller can't accidentally pass a free-text search
 * cursor into a category call or vice versa, even though the shape (two
 * independently-paginated sources plus cross-page dedup state) is
 * identical because it's the same underlying problem.
 */
export type CategoryDiscoveryCursor = {
  quraOffset: number;
  quraExhausted: boolean;
  googlePageToken: string | null;
  googleExhausted: boolean;
  mergedBusinessIds: string[];
  mergedPlaceIds: string[];
};

export const INITIAL_CATEGORY_DISCOVERY_CURSOR: CategoryDiscoveryCursor = {
  quraOffset: 0,
  quraExhausted: false,
  googlePageToken: null,
  googleExhausted: false,
  mergedBusinessIds: [],
  mergedPlaceIds: [],
};

async function fetchQuraCandidates(
  category: BusinessCategory,
  city: CityId,
  offset: number,
  excludeIds: string[],
) {
  const rows = await db.query.businessBlocks.findMany({
    where: and(
      eq(schema.businessBlocks.category, category),
      eq(schema.businessBlocks.city, city),
      excludeIds.length > 0
        ? notInArray(schema.businessBlocks.businessId, excludeIds)
        : undefined,
    ),
    with: {
      business: {
        columns: { id: true, name: true, username: true, image: true, bio: true },
      },
    },
    orderBy: (blocks, { desc }) => [desc(blocks.createdAt)],
    limit: QURA_PAGE_SIZE + 1,
  });

  const hasMore = rows.length > QURA_PAGE_SIZE;
  return { blocks: rows.slice(0, QURA_PAGE_SIZE), hasMore };
}

/** Server log only on a Google failure — the category page still renders
 * with whatever Qura-authoritative businesses it has (rule A never
 * depends on Google), same "Google failure never breaks a Qura page"
 * rule as unified search and the profile page's cache. */
async function fetchGoogleCandidates(
  category: BusinessCategory,
  city: CityId,
  pageToken: string | null,
): Promise<{ results: GooglePlaceSearchResult[]; nextPageToken: string | null }> {
  try {
    const { results, nextPageToken } = await searchGooglePlaces({
      // Same text-bias approach as unified search (Phase 4) — the
      // category's own label as query text, city as a text hint, no
      // fabricated coordinates.
      query: `${CATEGORY_META[category].label} in ${CITY_LABEL[city]}`,
      regionCode: "EG",
      pageSize: GOOGLE_PAGE_SIZE,
      pageToken: pageToken ?? undefined,
    });
    return { results, nextPageToken };
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      logWarning("category_discovery_google_failed", { category, city, reason: error.code });
      return { results: [], nextPageToken: null };
    }
    throw error;
  }
}

/**
 * The single entry point `/categories/[category]` calls — it never
 * touches `searchGooglePlaces` or `mapGoogleTypesToQuraCategories`
 * itself.
 *
 * ## Inclusion rules
 *
 *   A. Qura-authoritative — `business_blocks.category = category AND
 *      city = city`. Always included, Google entirely uninvolved.
 *   B. Qura-discoverable-via-Google — a business connected to a Google
 *      place whose `types` map to `category`, where the business's own
 *      category is something else. Only reachable if that specific place
 *      appears in this page's Google candidates.
 *   C. Google-only — a candidate place with no connected Qura business,
 *      whose `types` map to `category`.
 *
 * A place whose `types` don't map to `category` at all never appears
 * here — no fuzzy fallback.
 *
 * ## Ranking (Phase 11)
 *
 * Four tiers, most useful first:
 *
 *   Tier 1 — `kind: "qura"` AND `business.googlePlaceIds.length > 0`:
 *     explicit Qura category match, and connected to at least one Google
 *     Place (Phase 24: possibly several). Connection is read directly off
 *     the business's own connections — it does NOT require this page's
 *     Google search to have happened to surface that place. (Rule A's
 *     dedup means a business with a matching category is ALWAYS emitted
 *     as `kind: "qura"`, never grouped into a `"both"` result, even when
 *     it's also connected — so "connected" for ranking purposes has to be
 *     read off the business, not off `kind`.)
 *   Tier 2 — `kind: "qura"` AND `business.googlePlaceIds.length === 0`:
 *     explicit Qura category match, no Google connection.
 *   Tier 3 — `kind: "both"`: no business in the group matches the
 *     category itself (only reachable via `google_type`, given rule A's
 *     dedup — the `some(via === "category")` check is kept anyway as a
 *     defensive tier boundary in case that dedup ordering ever changes).
 *   Tier 4 — `kind: "google"`: no connected Qura business at all.
 *
 * ## Ranking within a tier (Phase 13)
 *
 * Tiers 1/2: sorted by Qura engagement — `reviewCount desc, followerCount
 * desc, averageRating desc (nulls last), id asc` (fixed priority list,
 * not a weighted score — see `ranking.ts`). Tier 3: each `"both"`
 * result's own `businesses[]` sorted the same way, but the `"both"`
 * results themselves stay in Google's order. Tier 4: untouched, Google's
 * own relevance order. No Google rating is fetched or used — Text
 * Search's field mask deliberately doesn't request it, since tiers 3/4
 * already have a deterministic total order from Google itself with
 * nothing left for a rating to break a tie on.
 *
 * ## Pagination
 *
 * Qura and Google paginate independently (offset / page token). A
 * business or place already shown on an earlier page is excluded via
 * `cursor.mergedBusinessIds`/`mergedPlaceIds` — same cross-page dedup
 * problem `lib/search/unified-search.ts` already solved for free-text
 * search, reused here for the identical reason.
 */
export async function getCategoryDiscovery({
  category,
  city,
  cursor = INITIAL_CATEGORY_DISCOVERY_CURSOR,
}: {
  category: BusinessCategory;
  city: CityId;
  cursor?: CategoryDiscoveryCursor;
}): Promise<{
  items: CategoryDiscoveryResult[];
  nextCursor: CategoryDiscoveryCursor | null;
}> {
  const totalStart = Date.now();

  const [quraOutcome, googleOutcome] = await Promise.all([
    cursor.quraExhausted
      ? Promise.resolve({ blocks: [] as Awaited<ReturnType<typeof fetchQuraCandidates>>["blocks"], hasMore: false })
      : withTiming("category_discovery_qura_query", { category, city }, () =>
          fetchQuraCandidates(category, city, cursor.quraOffset, cursor.mergedBusinessIds),
        ),
    cursor.googleExhausted
      ? Promise.resolve({ results: [] as GooglePlaceSearchResult[], nextPageToken: null })
      : withTiming("category_discovery_google_query", { category, city }, () =>
          fetchGoogleCandidates(category, city, cursor.googlePageToken),
        ),
  ]);

  // Rule C's gate — only candidates whose OWN types genuinely say
  // `category`, never Google's generic text-search relevance alone. Also
  // drop anything already shown on an earlier page.
  const mergedPlaceIds = new Set(cursor.mergedPlaceIds);
  const googleCandidates = googleOutcome.results.filter(
    (candidate) =>
      !mergedPlaceIds.has(candidate.placeId) &&
      mapGoogleTypesToQuraCategories(candidate.types).includes(category),
  );

  const connectedByPlaceIdRaw = await getBusinessesConnectedToPlaceIds(
    googleCandidates.map((candidate) => candidate.placeId),
  );
  // City scope (Phase 18, Option 1, closed for this module in Phase 23) —
  // a business connected to a Google place but registered in a different
  // city is excluded from the group entirely, not merely ranked lower.
  // `unified-search.ts` already applied this same filter after the same
  // shared `getBusinessesConnectedToPlaceIds` call; Phase 18 deliberately
  // left this module unchanged at the time (see that file's comment),
  // which meant a business from another city could surface here inside a
  // `"both"` group on the selected city's category page.
  const connectedByPlaceId = new Map(
    [...connectedByPlaceIdRaw.entries()].map(([placeId, businesses]) => [
      placeId,
      businesses.filter((business) => business.city === city),
    ]),
  );

  const addedBusinessIds = new Set<string>();
  const touchedPlaceIds = new Set<string>();
  const tier1: CategoryDiscoveryResult[] = [];
  const tier2: CategoryDiscoveryResult[] = [];
  const tier3: CategoryDiscoveryResult[] = [];
  const tier4: CategoryDiscoveryResult[] = [];

  // This page's Qura-authoritative businesses' OWN connections (Phase
  // 24: possibly several each) — one batched query, needed for the
  // tier 1/2 split below.
  const quraGooglePlaceIds = await getGooglePlaceIdsForBusinesses(
    quraOutcome.blocks.map((block) => block.business.id),
  );

  // Rule A — every Qura-authoritative business on this page, in its
  // existing order. Tier 1 or 2 depending on its own connection state.
  for (const block of quraOutcome.blocks) {
    if (addedBusinessIds.has(block.business.id)) continue;
    addedBusinessIds.add(block.business.id);

    const googlePlaceIds = quraGooglePlaceIds.get(block.business.id) ?? [];
    const business: CategoryDiscoveryBusiness = {
      id: block.business.id,
      username: block.business.username,
      name: block.business.name,
      image: block.business.image,
      bio: block.business.bio,
      category: block.category,
      city: block.city,
      googlePlaceIds,
      via: "category",
      previewData: (block.data as Record<string, unknown>) ?? null,
    };
    (googlePlaceIds.length > 0 ? tier1 : tier2).push({ kind: "qura", business });
  }

  // Rule B + C — Google-anchored results, in Google's own order. Tier 3
  // (has a connected business) or Tier 4 (no connected business).
  for (const place of googleCandidates) {
    touchedPlaceIds.add(place.placeId);
    const connected = connectedByPlaceId.get(place.placeId) ?? [];

    if (connected.length === 0) {
      tier4.push({ kind: "google", place });
      continue;
    }

    const businesses: CategoryDiscoveryBusiness[] = [];
    for (const business of connected) {
      if (addedBusinessIds.has(business.id)) continue;
      addedBusinessIds.add(business.id);
      const { googlePlaceId, ...rest } = business;
      businesses.push({
        ...rest,
        googlePlaceIds: [googlePlaceId],
        via: business.category === category ? "category" : "google_type",
        previewData: null,
      });
    }

    // Every connected business was already shown via rule A above —
    // nothing new to add for this place. NOT the same as "no connected
    // business," so this must never fall through to `kind: "google"`.
    if (businesses.length > 0) {
      tier3.push({ kind: "both", businesses, place });
    }
  }

  const quraExhausted = cursor.quraExhausted || !quraOutcome.hasMore;
  const googleExhausted = cursor.googleExhausted || !googleOutcome.nextPageToken;

  const nextCursor: CategoryDiscoveryCursor | null =
    quraExhausted && googleExhausted
      ? null
      : {
          quraOffset: quraExhausted ? cursor.quraOffset : cursor.quraOffset + QURA_PAGE_SIZE,
          quraExhausted,
          googlePageToken: googleExhausted ? null : googleOutcome.nextPageToken,
          googleExhausted,
          mergedBusinessIds: [...cursor.mergedBusinessIds, ...addedBusinessIds],
          mergedPlaceIds: [...cursor.mergedPlaceIds, ...touchedPlaceIds],
        };

  // One small batch of aggregate queries for every business id on this
  // page (never per-result) — feeds the pure ranking functions below.
  const signals = await withTiming(
    "category_discovery_ranking_signals_query",
    { category, city, count: addedBusinessIds.size },
    () => getQuraEngagementSignals(addedBusinessIds),
  );

  const items = [
    ...rankQuraResults(tier1, signals),
    ...rankQuraResults(tier2, signals),
    ...rankGoogleAnchoredResults(tier3, signals),
    ...tier4,
  ];

  logEvent("category_discovery_total", {
    category,
    city,
    count: items.length,
    durationMs: Date.now() - totalStart,
  });

  return { items, nextCursor };
}

async function getQuraEngagementSignals(
  businessIds: Set<string>,
): Promise<Map<string, QuraEngagementSignals>> {
  const ids = [...businessIds];
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
