/**
 * Phase 16 — controlled, disposable evaluation harness for unified
 * free-text search (`lib/search/unified-search.ts`). Same discipline as
 * Phase 15's `evaluate-discovery.ts`: observe the real production
 * function against real Postgres and a stubbed Google boundary, report
 * the actual ordering, assert invariants, change nothing about ranking.
 *
 *   npx tsx --conditions=react-server --env-file=.env src/db/evaluate-unified-search.ts
 *   (or: pnpm db:evaluate-unified-search)
 *
 * This is only possible without mocking Next's `cookies()` because
 * `searchUnified` now takes `city` as an explicit parameter (Phase 16's
 * first change, made specifically so this harness could call the real
 * production function directly — see the diff to `unified-search.ts` and
 * `search-users.ts`).
 */

process.env.GOOGLE_PLACES_API_KEY = "phase16-eval-key";

import { eq, inArray, like } from "drizzle-orm";

import { db, schema } from "@/db";
import { searchUnified } from "@/lib/search/unified-search";
import { INITIAL_SEARCH_CURSOR } from "@/lib/search/types";
import type { UnifiedSearchResult } from "@/lib/search/types";

const RUN_ID = `p16${Math.random().toString(36).slice(2, 8)}`;
console.log(`\n=== Phase 16 unified search evaluation — run id: ${RUN_ID} ===\n`);

// ─── Fixture place ids ──────────────────────────────────────────────────
const PLACE_SHARED = `${RUN_ID}_PLACE_SHARED`; // case 2: multi-business
const PLACE_GOOGLE_A = `${RUN_ID}_PLACE_GOOGLE_A`; // case 3: relevance order
const PLACE_GOOGLE_B = `${RUN_ID}_PLACE_GOOGLE_B`;
const PLACE_GOOGLE_C = `${RUN_ID}_PLACE_GOOGLE_C`;
const PLACE_PAGE1 = `${RUN_ID}_PLACE_PAGE1`; // case 6: pagination + resurfacing
const PLACE_PAGE2_NEW = `${RUN_ID}_PLACE_PAGE2_NEW`;
const PLACE_EXACT_GOOGLE = `${RUN_ID}_PLACE_EXACT_GOOGLE`; // Phase 18: exact Qura vs exact Google tie-break

const PAGE2_TOKEN = `${RUN_ID}_TOKEN_PAGE2`;

function googlePlace(id: string, name: string) {
  return {
    id,
    displayName: { text: name },
    formattedAddress: `${name} address`,
    location: { latitude: 24.09, longitude: 32.9 },
    types: ["cafe"],
  };
}

// Deliberately in a specific, known order — case 3 checks unified search
// preserves this relative order for the results that aren't exact
// matches or Qura-connected.
const PAGE1_PLACES = [
  googlePlace(PLACE_GOOGLE_A, `${RUN_ID} Google Third`),
  googlePlace(PLACE_SHARED, `${RUN_ID} Shared Place`),
  googlePlace(PLACE_GOOGLE_B, `${RUN_ID} Google First`),
  googlePlace(PLACE_GOOGLE_C, `${RUN_ID} Google Second`),
  googlePlace(PLACE_PAGE1, `${RUN_ID} Page One Place`),
  // Phase 18 regression: an UNCONNECTED Google place whose display name
  // is the exact query text — must rank in the exact tier, but AFTER the
  // Qura exact match (confirmed tie-break), not before it.
  googlePlace(PLACE_EXACT_GOOGLE, RUN_ID),
];
const PAGE2_PLACES = [
  googlePlace(PLACE_PAGE1, `${RUN_ID} Page One Place`), // case 6: deliberately repeated
  googlePlace(PLACE_PAGE2_NEW, `${RUN_ID} Page Two Place`),
];

let textSearchCalls = 0;
const textSearchQueriesSeen: string[] = [];

globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const urlStr = String(url);
  if (urlStr.includes("searchText")) {
    textSearchCalls++;
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    textSearchQueriesSeen.push(body.textQuery);
    const isPage2 = body.pageToken === PAGE2_TOKEN;
    return new Response(
      JSON.stringify({
        places: isPage2 ? PAGE2_PLACES : PAGE1_PLACES,
        nextPageToken: isPage2 ? undefined : PAGE2_TOKEN,
      }),
      { status: 200 },
    );
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
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   source: ${r.source}`);
    console.log(`   connected businesses: ${r.quraBusinesses.length}`);
    if (r.quraBusinesses.length > 0) {
      console.log(`     -> ${r.quraBusinesses.map((b) => b.username).join(", ")}`);
    }
    console.log("");
  });
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

  async function makeBusiness(username: string, googlePlaceId: string | null = null) {
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
      city: "aswan",
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

  // Case 1 — exact match: username is EXACTLY the search query.
  const bizExact = await makeBusiness(RUN_ID);

  // Case 2 — multiple Qura businesses connected to one Google place.
  const bizSharedA = await makeBusiness(`${RUN_ID}-shared-a`, PLACE_SHARED);
  const bizSharedB = await makeBusiness(`${RUN_ID}-shared-b`, PLACE_SHARED);
  const bizSharedC = await makeBusiness(`${RUN_ID}-shared-c`, PLACE_SHARED);

  // Case 4 — engagement: "aaa-quiet" sorts alphabetically BEFORE
  // "zzz-popular" despite having zero reviews/follows — if unified
  // search's Qura-side ordering is genuinely alphabetical (not
  // engagement-based), quiet will outrank popular. That's the thing this
  // case actually observes, not assumes.
  const bizQuiet = await makeBusiness(`${RUN_ID}-aaa-quiet`);
  const bizPopular = await makeBusiness(`${RUN_ID}-zzz-popular`);
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
      { followerId: reviewers[1].id, followingId: bizPopular.id },
    ]);

  console.log("FIXTURES CREATED");
  console.log(`  case 1 exact match:       @${bizExact.username}`);
  console.log(`  case 2 shared place:      3 businesses -> ${PLACE_SHARED}`);
  console.log(`  case 4 engagement:        @${bizQuiet.username} (quiet) vs @${bizPopular.username} (popular, 3 reviews/2 follows)`);

  try {
    // ── Case 1/2/3/4/5: one search matching all the fixtures above ──────
    const page1 = await searchUnified({ query: RUN_ID, cursor: INITIAL_SEARCH_CURSOR, city: "aswan" });
    printReport(`UNIFIED SEARCH: "${RUN_ID}" (page 1)`, page1.items);

    const page2 = page1.nextCursor
      ? await searchUnified({ query: RUN_ID, cursor: page1.nextCursor, city: "aswan" })
      : { items: [] as UnifiedSearchResult[], nextCursor: null };
    if (page1.nextCursor) printReport(`UNIFIED SEARCH: "${RUN_ID}" (page 2)`, page2.items);

    // ── Case 7: same query, two different cities ────────────────────────
    // Phase 18 implemented the Phase 17 proposal: Qura's ILIKE query is
    // now city-scoped too (previously it wasn't — see the Phase 16
    // report). All of this run's Qura fixtures are in "aswan", so a
    // "luxor" search should return zero of them.
    textSearchQueriesSeen.length = 0;
    const aswanCitySearch = await searchUnified({
      query: RUN_ID,
      cursor: INITIAL_SEARCH_CURSOR,
      city: "aswan",
    });
    const aswanQuery = textSearchQueriesSeen.at(-1);
    const luxorCitySearch = await searchUnified({
      query: RUN_ID,
      cursor: INITIAL_SEARCH_CURSOR,
      city: "luxor",
    });
    const luxorQuery = textSearchQueriesSeen.at(-1);
    console.log(`\nCITY BEHAVIOR (case 7)\n`);
    console.log(`  Google query text when city=aswan: "${aswanQuery}"`);
    console.log(`  Google query text when city=luxor: "${luxorQuery}"`);
    console.log(
      `  Qura businesses found when city=aswan: ${aswanCitySearch.items.flatMap((r) => r.quraBusinesses).length}\n` +
        `  Qura businesses found when city=luxor: ${luxorCitySearch.items.flatMap((r) => r.quraBusinesses).length}` +
        ` (all fixtures are in aswan -- expect 0)`,
    );

    console.log("\n=== INVARIANTS ===\n");

    // Case 1 — exact match ranks first.
    assert(
      page1.items[0]?.quraBusinesses.some((b) => b.id === bizExact.id) ?? false,
      "case 1: exact-username match ranks first in the result list",
    );

    // Phase 18 regression: Qura exact match beats Google exact match.
    const exactQuraIdx = page1.items.findIndex((r) =>
      r.quraBusinesses.some((b) => b.id === bizExact.id),
    );
    const exactGoogleIdx = page1.items.findIndex(
      (r) => r.source === "google" && r.googlePlace?.placeId === PLACE_EXACT_GOOGLE,
    );
    assert(
      exactQuraIdx !== -1 && exactGoogleIdx !== -1 && exactQuraIdx < exactGoogleIdx,
      "Phase 18: Qura exact match ranks BEFORE an unconnected Google place with the identical exact name",
    );

    // Case 2 — all three businesses sharing PLACE_SHARED are present as
    // ONE grouped result, none dropped.
    const sharedResult = page1.items.find((r) => r.googlePlaceId === PLACE_SHARED);
    assert(!!sharedResult, "case 2: PLACE_SHARED surfaces as one result");
    if (sharedResult) {
      const ids = sharedResult.quraBusinesses.map((b) => b.id).sort();
      const expected = [bizSharedA.id, bizSharedB.id, bizSharedC.id].sort();
      assert(
        JSON.stringify(ids) === JSON.stringify(expected),
        "case 2: all three businesses connected to PLACE_SHARED are present in ONE result, none dropped",
      );
    }

    // Case 3 — Google's relevance order preserved for the non-exact,
    // non-connected google results (A/B/C, in that PAGE1_PLACES order).
    const googleOnlyOrder = page1.items
      .filter((r) => r.source === "google")
      .map((r) => r.googlePlace?.placeId);
    const expectedRelativeOrder = [PLACE_GOOGLE_A, PLACE_GOOGLE_B, PLACE_GOOGLE_C].filter((id) =>
      googleOnlyOrder.includes(id),
    );
    const actualRelativeOrder = googleOnlyOrder.filter((id) =>
      [PLACE_GOOGLE_A, PLACE_GOOGLE_B, PLACE_GOOGLE_C].includes(id as string),
    );
    assert(
      JSON.stringify(actualRelativeOrder) === JSON.stringify(expectedRelativeOrder),
      "case 3: Google's own relevance order (A, B, C) is preserved among google-only results, not re-sorted",
    );

    // Case 4 — OBSERVED finding, not a pass/fail on "correctness": is
    // Qura ordering alphabetical or engagement-based? Reported either way.
    const quietIdx = page1.items.findIndex((r) => r.quraBusinesses.some((b) => b.id === bizQuiet.id));
    const popularIdx = page1.items.findIndex((r) => r.quraBusinesses.some((b) => b.id === bizPopular.id));
    console.log(
      `\n  OBSERVATION (case 4): quiet business (0 engagement, alphabetically first) is at position ${quietIdx}; ` +
        `popular business (3 reviews/2 follows, alphabetically last) is at position ${popularIdx}. ` +
        `${quietIdx < popularIdx ? "Ordering is alphabetical (username asc) -- engagement is NOT currently a factor in unified search ranking, unlike category discovery's Phase 13 ranking." : "Popular ranks above quiet despite alphabetical order -- engagement DOES appear to influence unified search ranking."}`,
    );

    // Case 5 — cross-source duplicate check: a business inside the
    // "both"/shared result must not ALSO appear as a separate qura-only
    // entry elsewhere in the same page.
    const allBusinessIds = page1.items.flatMap((r) => r.quraBusinesses.map((b) => b.id));
    assert(
      allBusinessIds.length === new Set(allBusinessIds).size,
      "case 5: no business (including PLACE_SHARED's three) appears in more than one result on the same page",
    );

    // Case 6 — pagination: PLACE_PAGE1 (repeated by the stub on page 2)
    // must not resurface, and PLACE_PAGE2_NEW must appear exactly once.
    const placeIdsAcrossPages = [...page1.items, ...page2.items]
      .map((r) => r.googlePlaceId)
      .filter((id): id is string => id !== null);
    assert(
      placeIdsAcrossPages.length === new Set(placeIdsAcrossPages).size,
      "case 6: no Google place appears twice across page 1 + page 2, even though the stub deliberately repeats PLACE_PAGE1",
    );
    assert(
      placeIdsAcrossPages.filter((id) => id === PLACE_PAGE2_NEW).length === 1,
      "case 6: the genuinely new page-2 place appears exactly once",
    );

    // Case 7 — Google query text actually differs by city.
    assert(
      aswanQuery !== luxorQuery && aswanQuery?.includes("Aswan") === true && luxorQuery?.includes("Luxor") === true,
      "case 7: the Google Text Search query text is city-scoped (changes between Aswan and Luxor)",
    );
    // Phase 18 — Qura side is now city-scoped too.
    assert(
      aswanCitySearch.items.flatMap((r) => r.quraBusinesses).length > 0,
      "case 7: Qura businesses ARE found when searching the correct city (aswan)",
    );
    assert(
      luxorCitySearch.items.flatMap((r) => r.quraBusinesses).length === 0,
      "case 7: zero Qura businesses found when searching a different city (luxor) -- Qura side is now city-scoped (Phase 18)",
    );
  } finally {
    console.log("\n=== CLEANUP ===\n");

    const placeIds = [
      PLACE_SHARED,
      PLACE_GOOGLE_A,
      PLACE_GOOGLE_B,
      PLACE_GOOGLE_C,
      PLACE_PAGE1,
      PLACE_PAGE2_NEW,
      PLACE_EXACT_GOOGLE,
    ];
    await db
      .delete(schema.googlePlaceClaimConflicts)
      .where(inArray(schema.googlePlaceClaimConflicts.googlePlaceId, placeIds));
    await db.delete(schema.googlePlacesCache).where(inArray(schema.googlePlacesCache.placeId, placeIds));
    await db.delete(schema.users).where(eq(schema.users.id, owner.id)); // cascades
    await db.delete(schema.users).where(
      inArray(
        schema.users.id,
        reviewers.map((r) => r.id),
      ),
    );

    const leftover = await db.query.users.findMany({
      where: like(schema.users.username, `${RUN_ID}%`),
    });
    assert(leftover.length === 0, `no fixture rows remain with the '${RUN_ID}' prefix after cleanup`);

    console.log(`\n${passed} passed, ${failed} failed\n`);
    console.log(`Total Text Search calls made this run: ${textSearchCalls}`);
    if (failed > 0) process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("Evaluation crashed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
