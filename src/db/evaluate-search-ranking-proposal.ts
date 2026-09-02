/**
 * Phase 17 — PROPOSAL evaluation, not implementation. Runs the real,
 * unmodified `searchUnified` (today's behavior) side by side with a
 * draft re-ranker implementing the Phase 17 contract, against the same
 * controlled dataset, and prints both orderings for comparison.
 *
 * `draftRankUnifiedResults` below is NOT called from anywhere in
 * `src/lib` — it exists only in this file, operates only on
 * `searchUnified`'s already-public output shape (`UnifiedSearchResult[]`)
 * plus a signals map, and touches no production module. If the observed
 * "proposed" ordering below is approved, implementing it for real means
 * porting this logic into `merge.ts`/`unified-search.ts` — that porting
 * has NOT happened here.
 *
 *   npx tsx --conditions=react-server --env-file=.env src/db/evaluate-search-ranking-proposal.ts
 *   (or: pnpm db:evaluate-search-ranking-proposal)
 *
 * PROPOSED CONTRACT (see the Phase 17 report for the full write-up):
 *   1. Exact match — Qura-sourced exact matches before Google-sourced/
 *      "both" exact matches (confirmed tie-break).
 *   2. Google-relevance-ordered ("both"/"google", non-exact) — UNCHANGED,
 *      never reordered by engagement.
 *   3. Remaining Qura-only — sorted by engagement (reviewCount desc,
 *      followerCount desc, averageRating desc, id asc) instead of
 *      today's username asc.
 *   City scope: Qura results filtered to the active city (confirmed
 *   Option 1) — simulated here by filtering `searchUnified`'s own output
 *   post-hoc using each business's `city` field it already returns, not
 *   a new SQL predicate — sufficient to demonstrate the resulting
 *   ordering; a real implementation would filter at the query instead.
 *   Business ordering inside a "both" group: same engagement priority
 *   list as tier 3.
 */

process.env.GOOGLE_PLACES_API_KEY = "phase17-eval-key";

import { eq, inArray, like } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  getFollowerCountsForBusinesses,
  getReviewSummariesForBusinesses,
} from "@/lib/business/queries";
import { searchUnified } from "@/lib/search/unified-search";
import { INITIAL_SEARCH_CURSOR } from "@/lib/search/types";
import type { UnifiedSearchResult } from "@/lib/search/types";
import type { CityId } from "@/db/schema";

const RUN_ID = `p17${Math.random().toString(36).slice(2, 8)}`;
console.log(`\n=== Phase 17 ranking PROPOSAL evaluation — run id: ${RUN_ID} ===\n`);

// ─── Draft engagement signal type + comparator (mirrors Phase 13's
// ranking.ts priority list exactly, applied here to unified search's
// output shape instead of category discovery's). ──────────────────────
type EngagementSignals = { reviewCount: number; averageRating: number | null; followerCount: number };
const EMPTY_SIGNALS: EngagementSignals = { reviewCount: 0, averageRating: null, followerCount: 0 };

function compareByEngagement(
  aId: string,
  bId: string,
  signals: Map<string, EngagementSignals>,
): number {
  const a = signals.get(aId) ?? EMPTY_SIGNALS;
  const b = signals.get(bId) ?? EMPTY_SIGNALS;
  if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount;
  if (a.followerCount !== b.followerCount) return b.followerCount - a.followerCount;
  const ra = a.averageRating ?? -Infinity;
  const rb = b.averageRating ?? -Infinity;
  if (ra !== rb) return rb - ra;
  return aId < bId ? -1 : aId > bId ? 1 : 0;
}

function isExactMatch(r: UnifiedSearchResult, normalizedQuery: string): boolean {
  if (r.name.toLowerCase() === normalizedQuery) return true;
  return r.quraBusinesses.some((b) => b.username.toLowerCase() === normalizedQuery);
}

/** THE PROPOSAL. Pure — takes `searchUnified`'s real output, the query,
 * an engagement signal map, and the active city; returns a re-ordered
 * (and city-filtered) copy. Never calls the DB or Google itself. */
function draftRankUnifiedResults(
  results: UnifiedSearchResult[],
  query: string,
  signals: Map<string, EngagementSignals>,
  activeCity: CityId,
): UnifiedSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  // City scope (Option 1): drop Qura businesses not in the active city;
  // drop a "qura"/"both" result entirely if nothing remains. Google-only
  // results are untouched (already city-biased by Google's own query).
  const cityFiltered = results
    .map((r) => {
      if (r.source === "google") return r;
      const kept = r.quraBusinesses.filter((b) => b.city === activeCity);
      if (kept.length === 0) return null;
      if (r.source === "qura") return { ...r, quraBusinesses: kept };
      // "both" with some businesses filtered out — still "both" as long
      // as at least one Qura business remains; the Google side is
      // unaffected either way.
      return { ...r, quraBusinesses: kept };
    })
    .filter((r): r is UnifiedSearchResult => r !== null);

  // Re-sort businesses inside every "both" group by engagement.
  const withGroupsRanked = cityFiltered.map((r) =>
    r.source === "both"
      ? {
          ...r,
          quraBusinesses: [...r.quraBusinesses].sort((a, b) =>
            compareByEngagement(a.id, b.id, signals),
          ),
        }
      : r,
  );

  const exactQura: UnifiedSearchResult[] = [];
  const exactOther: UnifiedSearchResult[] = [];
  const googleOrdered: UnifiedSearchResult[] = [];
  const quraRest: UnifiedSearchResult[] = [];

  for (const r of withGroupsRanked) {
    const exact = isExactMatch(r, normalizedQuery);
    if (exact && r.source === "qura") exactQura.push(r);
    else if (exact) exactOther.push(r);
    else if (r.source === "qura") quraRest.push(r);
    else googleOrdered.push(r);
  }

  quraRest.sort((a, b) => compareByEngagement(a.quraBusinesses[0].id, b.quraBusinesses[0].id, signals));

  return [...exactQura, ...exactOther, ...googleOrdered, ...quraRest];
}

// ─── Fetch stub — same PAGE1/PAGE2 curated set as Phase 16, reused so
// the two harnesses' baselines are directly comparable. ────────────────
function googlePlace(id: string, name: string) {
  return {
    id,
    displayName: { text: name },
    formattedAddress: `${name} address`,
    location: { latitude: 24.09, longitude: 32.9 },
    types: ["cafe"],
  };
}

const PLACE_SHARED = `${RUN_ID}_PLACE_SHARED`;
const PLACE_GOOGLE_A = `${RUN_ID}_PLACE_GOOGLE_A`;
const PLACE_GOOGLE_B = `${RUN_ID}_PLACE_GOOGLE_B`;

const PAGE1_PLACES = [
  googlePlace(PLACE_GOOGLE_A, `${RUN_ID} Google First`),
  googlePlace(PLACE_SHARED, `${RUN_ID} Shared Place`),
  googlePlace(PLACE_GOOGLE_B, `${RUN_ID} Google Second`),
];

globalThis.fetch = (async (url: string) => {
  const urlStr = String(url);
  if (urlStr.includes("searchText")) {
    return new Response(JSON.stringify({ places: PAGE1_PLACES, nextPageToken: undefined }), {
      status: 200,
    });
  }
  return new Response(JSON.stringify({}), { status: 404 });
}) as typeof fetch;

let passed = 0;
let failed = 0;
function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ok: ${message}`);
  } else {
    failed++;
    console.log(`  FAIL: ${message}`);
  }
}

function printReport(title: string, items: UnifiedSearchResult[]) {
  console.log(`\n${title}\n`);
  if (items.length === 0) {
    console.log("  (no results)");
    return;
  }
  items.forEach((r, i) => {
    const businesses = r.quraBusinesses.map((b) => `@${b.username}[${b.city}]`).join(", ");
    console.log(
      `${i + 1}. ${r.name}  source=${r.source}${businesses ? `  businesses=${businesses}` : ""}`,
    );
  });
  console.log("");
}

async function main() {
  const [owner] = await db
    .insert(schema.users)
    .values({
      name: `${RUN_ID} Owner`,
      email: `${RUN_ID}-owner@example.invalid`,
      emailVerified: true,
      username: `${RUN_ID}-owner`,
      role: "business_owner",
      status: "active",
    })
    .returning();

  async function makeBusiness(username: string, city: CityId, googlePlaceId: string | null = null) {
    const [biz] = await db
      .insert(schema.users)
      .values({
        name: username,
        email: `${username}@example.invalid`,
        emailVerified: true,
        username,
        role: "business_owner",
        status: "active",
        ownerId: owner.id,
      })
      .returning();
    await db.insert(schema.businessBlocks).values({
      businessId: biz.id,
      category: "food-drinks",
      data: {},
      city,
    });
    if (googlePlaceId) {
      await db.insert(schema.businessGooglePlaces).values({ businessId: biz.id, googlePlaceId });
    }
    return biz;
  }

  async function makeReviewer(n: number) {
    const [u] = await db
      .insert(schema.users)
      .values({
        name: `${RUN_ID} Reviewer ${n}`,
        email: `${RUN_ID}-reviewer-${n}@example.invalid`,
        emailVerified: true,
        username: `${RUN_ID}-reviewer-${n}`,
        role: "business_owner",
        status: "active",
      })
      .returning();
    return u;
  }

  // Exact match, in-city (aswan).
  const bizExact = await makeBusiness(RUN_ID, "aswan");
  // Engagement pair, in-city — alphabetically "quiet" first, "popular" last.
  const bizQuiet = await makeBusiness(`${RUN_ID}-aaa-quiet`, "aswan");
  const bizPopular = await makeBusiness(`${RUN_ID}-zzz-popular`, "aswan");
  // Out-of-city business — should be filtered out entirely under Option 1.
  const bizOtherCity = await makeBusiness(`${RUN_ID}-other-city`, "luxor");
  // Shared Google place, two businesses in different cities.
  const bizSharedInCity = await makeBusiness(`${RUN_ID}-shared-in-city`, "aswan", PLACE_SHARED);
  const bizSharedOtherCity = await makeBusiness(
    `${RUN_ID}-shared-other-city`,
    "luxor",
    PLACE_SHARED,
  );

  const reviewers = [await makeReviewer(1), await makeReviewer(2), await makeReviewer(3)];
  for (const reviewer of reviewers) {
    await db
      .insert(schema.businessReviews)
      .values({ businessId: bizPopular.id, authorId: reviewer.id, rating: 5 });
  }
  await db
    .insert(schema.follows)
    .values([
      { followerId: reviewers[0].id, followingId: bizPopular.id },
      { followerId: reviewers[1].id, followingId: bizSharedOtherCity.id },
    ]);
  // Give the in-city shared business fewer signals than its out-of-city
  // sibling, to prove group-internal ranking survives city filtering
  // independently (the out-of-city one gets filtered OUT of the group
  // entirely, not just ranked lower within it).
  await db
    .insert(schema.businessReviews)
    .values({ businessId: bizSharedOtherCity.id, authorId: reviewers[2].id, rating: 4 });

  try {
    const today = await searchUnified({
      query: RUN_ID,
      cursor: INITIAL_SEARCH_CURSOR,
      city: "aswan",
    });
    printReport("TODAY'S BEHAVIOR (unchanged production code)", today.items);

    const signals = await buildSignals([
      bizExact.id,
      bizQuiet.id,
      bizPopular.id,
      bizOtherCity.id,
      bizSharedInCity.id,
      bizSharedOtherCity.id,
    ]);
    const proposed = draftRankUnifiedResults(today.items, RUN_ID, signals, "aswan");
    printReport("PROPOSED CONTRACT (draft re-rank, not yet implemented)", proposed);

    console.log("=== INVARIANTS ===\n");

    // Phase 19 audit correction: this assertion originally checked "today
    // (unpatched production) still has the Phase 16 alphabetical bug" —
    // that premise died the moment Phase 18 actually ported this
    // contract into `merge.ts`. Re-running this harness post-Phase-18
    // caught exactly that: the assertion below FAILED on the first
    // Phase 19 audit run, because "TODAY" is real production code and
    // production is now already fixed. That is not a regression — it is
    // this test file being stale documentation of a since-resolved
    // state. Fixed here to assert what's actually true post-Phase-18:
    // production's real output already matches the proposal, so the
    // draft re-ranker applied on top of it should be a no-op.
    const todayQuietIdx = today.items.findIndex((r) => r.quraBusinesses.some((b) => b.id === bizQuiet.id));
    const todayPopularIdx = today.items.findIndex((r) => r.quraBusinesses.some((b) => b.id === bizPopular.id));
    assert(
      todayPopularIdx < todayQuietIdx,
      "TODAY (post-Phase-18 production): popular already outranks quiet -- the Phase 16 alphabetical bug is fixed in production, not just in the draft proposal",
    );

    // Proposal fixes it.
    const propQuietIdx = proposed.findIndex((r) => r.quraBusinesses.some((b) => b.id === bizQuiet.id));
    const propPopularIdx = proposed.findIndex((r) => r.quraBusinesses.some((b) => b.id === bizPopular.id));
    assert(
      propPopularIdx !== -1 && propQuietIdx !== -1 && propPopularIdx < propQuietIdx,
      "PROPOSED: popular (3 reviews/1 follow) now outranks quiet (0 engagement)",
    );

    // City scope: out-of-city standalone business is gone.
    assert(
      !proposed.some((r) => r.quraBusinesses.some((b) => b.id === bizOtherCity.id)),
      "PROPOSED: out-of-city standalone business is excluded entirely (Option 1)",
    );

    // City scope + group survival: the shared place's group still
    // appears (in-city business remains), but only with the in-city
    // business, not the out-of-city one.
    const sharedProposed = proposed.find((r) => r.googlePlaceId === PLACE_SHARED);
    assert(!!sharedProposed, "PROPOSED: PLACE_SHARED's group survives (at least one in-city business remains)");
    if (sharedProposed) {
      assert(
        sharedProposed.quraBusinesses.some((b) => b.id === bizSharedInCity.id),
        "PROPOSED: the in-city business is present in the group",
      );
      assert(
        !sharedProposed.quraBusinesses.some((b) => b.id === bizSharedOtherCity.id),
        "PROPOSED: the out-of-city business is filtered OUT of the group, not just ranked last",
      );
    }

    // Exact match still wins overall, Qura-sourced.
    assert(
      proposed[0]?.quraBusinesses.some((b) => b.id === bizExact.id) ?? false,
      "PROPOSED: Qura exact match still ranks first overall",
    );

    // Google-relevance order among non-exact google-anchored results is
    // untouched by the proposal (still A before B, same as today).
    const todayGoogleOrder = today.items
      .filter((r) => r.source === "google")
      .map((r) => r.googlePlace?.placeId);
    const proposedGoogleOrder = proposed
      .filter((r) => r.source === "google")
      .map((r) => r.googlePlace?.placeId);
    assert(
      JSON.stringify(todayGoogleOrder) === JSON.stringify(proposedGoogleOrder),
      "PROPOSED: Google-relevance order among non-exact results is UNCHANGED from today (engagement never reorders it)",
    );
  } finally {
    console.log("\n=== CLEANUP ===\n");
    const placeIds = [PLACE_SHARED, PLACE_GOOGLE_A, PLACE_GOOGLE_B];
    await db
      .delete(schema.googlePlaceClaimConflicts)
      .where(inArray(schema.googlePlaceClaimConflicts.googlePlaceId, placeIds));
    await db.delete(schema.googlePlacesCache).where(inArray(schema.googlePlacesCache.placeId, placeIds));
    await db.delete(schema.users).where(eq(schema.users.id, owner.id));
    await db.delete(schema.users).where(
      inArray(
        schema.users.id,
        reviewers.map((r) => r.id),
      ),
    );

    const leftover = await db.query.users.findMany({ where: like(schema.users.username, `${RUN_ID}%`) });
    assert(leftover.length === 0, `no fixture rows remain with the '${RUN_ID}' prefix after cleanup`);

    console.log(`\n${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exitCode = 1;
  }
}

async function buildSignals(businessIds: string[]): Promise<Map<string, EngagementSignals>> {
  const [reviewSummaries, followerCounts] = await Promise.all([
    getReviewSummariesForBusinesses(businessIds),
    getFollowerCountsForBusinesses(businessIds),
  ]);
  return new Map(
    businessIds.map((id) => [
      id,
      {
        reviewCount: reviewSummaries.get(id)?.reviewCount ?? 0,
        averageRating: reviewSummaries.get(id)?.averageRating ?? null,
        followerCount: followerCounts.get(id) ?? 0,
      },
    ]),
  );
}

main()
  .catch((err) => {
    console.error("Evaluation crashed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
