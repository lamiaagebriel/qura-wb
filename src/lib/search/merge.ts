import type { GooglePlaceSearchResult } from "@/lib/google-places/types";

import { compareByEngagement, type QuraEngagementSignals } from "./ranking";
import type { QuraBusinessSummary, UnifiedSearchResult } from "./types";

type Group = {
  googlePlaceId: string | null;
  googlePlace: GooglePlaceSearchResult | null;
  businesses: QuraBusinessSummary[];
};

/**
 * The entire dedup/merge/rank decision, isolated from the database and
 * Google's HTTP client on purpose — see the Phase 4 report's Part 33.
 * Everything it needs arrives as plain data:
 *
 * - `googleCandidates`: this page's Google Text Search results, in
 *   Google's own relevance order — that order is preserved for the
 *   "google"/"both" bucket below, never re-sorted (Phase 17/18: still
 *   true — engagement never reorders this bucket).
 * - `quraCandidates`: this page's Qura `ILIKE` matches — already
 *   city-filtered by the caller (Phase 18; see `unified-search.ts`'s
 *   `searchQuraCandidates`), in `username asc` DB order (irrelevant to
 *   the final order now, since Phase 18 re-sorts the non-exact Qura
 *   bucket by engagement below — the DB order only matters as a stable
 *   input, not an output).
 * - `connectedByPlaceId`: for every Google candidate's place id, every
 *   Qura business connected to it (`business_blocks.googlePlaceId`) —
 *   built with ONE query (`WHERE googlePlaceId IN (...)`) by the caller,
 *   not per-candidate. **Phase 5**: this is an array per place id, not a
 *   single business — many businesses may share one Google place, and
 *   none of them may be silently dropped.
 * - `alreadyMergedBusinessIds`/`alreadyMergedPlaceIds`: identity already
 *   shown on an earlier page (`UnifiedSearchCursor`) — skipped here as a
 *   safety net even though the caller should also filter its own Qura
 *   query by the business-id set.
 * - `signals` (Phase 18): batched Qura engagement per business id,
 *   fetched once by the caller (`getReviewSummariesForBusinesses`/
 *   `getFollowerCountsForBusinesses`, Phase 13's queries, reused
 *   unchanged) — never fetched per-result here.
 *
 * Results are grouped **by Google place id** when one is known, not one
 * row per business: a place with three connected Qura businesses is one
 * `"both"` result carrying all three in `quraBusinesses`, never three
 * separate rows and never an arbitrary pick of one. A Qura business with
 * no `googlePlaceId` gets its own standalone group (`"qura"`, one
 * business). The only automatic grouping key (Phase 4, Part 5/9,
 * unchanged) is `googlePlaceId` equality — no name similarity, no
 * coordinate proximity, no address text ever groups two results.
 *
 * Known tradeoff (documented, not silently accepted): if a Qura business
 * connects to a Google place *after* that place's group has already been
 * shown on an earlier page in this same scroll session, it will appear as
 * its own standalone `"qura"`-labeled row rather than retroactively
 * rejoining the earlier group — re-rendering the whole earlier group a
 * second time would be a worse duplicate-looking result than this. This
 * only matters for a search session spanning a live reconnection event,
 * which is rare.
 *
 * ## Ranking (Phase 17 design, Phase 18 implementation)
 *
 *   1. Exact match — query text equals any grouped business's username or
 *      name exactly (case-insensitive). Qura-sourced exact matches
 *      (`source: "qura"`) rank before Google/`"both"`-sourced exact
 *      matches (confirmed tie-break: a user searching an exact name most
 *      likely wants the actionable Qura profile).
 *   2. Google's own relevance order — every remaining Google-anchored
 *      group (`"both"`/`"google"`, non-exact), in the order Google
 *      returned it. Engagement NEVER reorders this bucket.
 *   3. Whatever's left of the Qura `ILIKE` matches (not exact, not
 *      already grouped above) — sorted by Qura engagement
 *      (`compareByEngagement`: reviewCount desc, followerCount desc,
 *      averageRating desc, id asc), replacing the old `username asc`
 *      order.
 *
 * Within EVERY multi-business group (any bucket), the businesses inside
 * are sorted by the same engagement comparator — consistent with how
 * category discovery already orders a `"both"` group's businesses.
 */
export function mergeSearchCandidates({
  query,
  googleCandidates,
  quraCandidates,
  connectedByPlaceId,
  alreadyMergedBusinessIds,
  alreadyMergedPlaceIds,
  signals,
}: {
  query: string;
  googleCandidates: GooglePlaceSearchResult[];
  quraCandidates: QuraBusinessSummary[];
  connectedByPlaceId: Map<string, QuraBusinessSummary[]>;
  alreadyMergedBusinessIds: Set<string>;
  alreadyMergedPlaceIds: Set<string>;
  signals: Map<string, QuraEngagementSignals>;
}): { results: UnifiedSearchResult[]; mergedBusinessIds: string[]; mergedPlaceIds: string[] } {
  const normalizedQuery = query.trim().toLowerCase();
  const groups = new Map<string, Group>();
  const addedBusinessIds = new Set<string>();
  const touchedPlaceIds = new Set<string>();
  const googleOrderKeys: string[] = [];
  const restOrderKeys: string[] = [];

  const isExactMatch = (business: QuraBusinessSummary): boolean =>
    normalizedQuery.length > 0 &&
    (business.username.toLowerCase() === normalizedQuery ||
      business.name.toLowerCase() === normalizedQuery);

  // Pass 1 — Google candidates, in Google's own relevance order.
  for (const candidate of googleCandidates) {
    if (alreadyMergedPlaceIds.has(candidate.placeId)) continue;

    const key = `place:${candidate.placeId}`;
    const group: Group = groups.get(key) ?? {
      googlePlaceId: candidate.placeId,
      googlePlace: null,
      businesses: [],
    };
    group.googlePlace = candidate;
    touchedPlaceIds.add(candidate.placeId);

    for (const business of connectedByPlaceId.get(candidate.placeId) ?? []) {
      if (addedBusinessIds.has(business.id) || alreadyMergedBusinessIds.has(business.id)) {
        continue;
      }
      addedBusinessIds.add(business.id);
      group.businesses.push(business);
    }

    if (!groups.has(key)) googleOrderKeys.push(key);
    groups.set(key, group);
  }

  // Pass 2 — remaining Qura `ILIKE` matches not already grouped above.
  for (const business of quraCandidates) {
    if (addedBusinessIds.has(business.id) || alreadyMergedBusinessIds.has(business.id)) {
      continue;
    }
    addedBusinessIds.add(business.id);

    // Phase 24: a business may have several connections — its earliest
    // one (`[0]`, `getGooglePlaceIdsForBusinesses`' insertion order) is
    // treated as "primary" for grouping purposes here, the same
    // deliberate simplification `category-discovery.ts` doesn't need to
    // make (it never has to pick just one). A multi-branch business whose
    // *other* branches also matched Google candidates this page still
    // gets folded into each of THOSE groups independently in Pass 1 —
    // this fallback only decides where a business with no Pass-1 match
    // lands.
    const primaryPlaceId = business.googlePlaceIds[0] ?? null;
    if (primaryPlaceId && !alreadyMergedPlaceIds.has(primaryPlaceId)) {
      const key = `place:${primaryPlaceId}`;
      const isNewGroup = !groups.has(key);
      const group: Group = groups.get(key) ?? {
        googlePlaceId: primaryPlaceId,
        googlePlace: null,
        businesses: [],
      };
      group.businesses.push(business);
      touchedPlaceIds.add(primaryPlaceId);
      groups.set(key, group);
      // Only queue for the "rest" bucket if Google didn't already place
      // this group — a group Google's slate already ordered stays where
      // pass 1 put it.
      if (isNewGroup) restOrderKeys.push(key);
    } else {
      const key = `business:${business.id}`;
      groups.set(key, { googlePlaceId: null, googlePlace: null, businesses: [business] });
      restOrderKeys.push(key);
    }
  }

  const isExactGroup = (group: Group) => group.businesses.some(isExactMatch);
  // Mirrors `toUnifiedResult`'s own source derivation — used here only to
  // decide the exact-tier tie-break (Qura-sourced before Google/"both").
  const groupSource = (group: Group): "qura" | "both" | "google" =>
    group.googlePlaceId === null ? "qura" : group.businesses.length > 0 ? "both" : "google";

  const exactQura: string[] = [];
  const exactOther: string[] = [];
  const googleBucket: string[] = [];
  const restBucket: string[] = [];

  for (const key of googleOrderKeys) {
    const group = groups.get(key)!;
    if (isExactGroup(group)) (groupSource(group) === "qura" ? exactQura : exactOther).push(key);
    else googleBucket.push(key);
  }
  for (const key of restOrderKeys) {
    const group = groups.get(key)!;
    if (isExactGroup(group)) (groupSource(group) === "qura" ? exactQura : exactOther).push(key);
    else restBucket.push(key);
  }

  // Every multi-business group, in every bucket, gets its businesses
  // sorted by engagement internally first — this never changes the
  // group's own position (Google-anchored groups stay in Google's
  // order), but it does determine which business is "best" for the
  // restBucket group-ordering step below, so it has to run first.
  for (const group of groups.values()) {
    if (group.businesses.length > 1) {
      group.businesses.sort((a, b) => compareByEngagement(a, b, signals));
    }
  }

  // Rank the non-exact Qura-only bucket by engagement instead of DB
  // order — the Phase 17/18 fix. A group's own sort key is its best
  // (now-first, post-internal-sort) business.
  restBucket.sort((keyA, keyB) => {
    const a = groups.get(keyA)!.businesses;
    const b = groups.get(keyB)!.businesses;
    return compareByEngagement(a[0], b[0], signals);
  });

  const results = [...exactQura, ...exactOther, ...googleBucket, ...restBucket].map((key) =>
    toUnifiedResult(groups.get(key)!),
  );

  return {
    results,
    mergedBusinessIds: [...addedBusinessIds],
    mergedPlaceIds: [...touchedPlaceIds],
  };
}

function toUnifiedResult(group: Group): UnifiedSearchResult {
  const { googlePlaceId, googlePlace, businesses } = group;
  const source =
    googlePlaceId === null ? "qura" : businesses.length > 0 ? "both" : "google";

  const id =
    googlePlaceId !== null ? `${source}:${googlePlaceId}` : `qura:${businesses[0].id}`;

  return {
    id,
    source,
    name: businesses[0]?.name ?? googlePlace?.name ?? "",
    googlePlaceId,
    quraBusinesses: businesses.map((business) => ({
      id: business.id,
      username: business.username,
      image: business.image,
      bio: business.bio,
      category: business.category,
      city: business.city,
    })),
    googlePlace: googlePlace
      ? {
          placeId: googlePlace.placeId,
          name: googlePlace.name,
          address: googlePlace.address ?? null,
          location: googlePlace.location ?? null,
          types: googlePlace.types,
        }
      : null,
  };
}
