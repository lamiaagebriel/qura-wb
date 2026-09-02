/**
 * Phase 15 — controlled, disposable evaluation harness for the full
 * discovery stack (unified search, category discovery, ranking,
 * pagination, the Phase 7 cache). NOT part of the application — never
 * imported from `src/app` or `src/lib`, only ever run directly:
 *
 *   npx tsx --conditions=react-server --env-file=.env src/db/evaluate-discovery.ts
 *   (or: pnpm db:evaluate-discovery)
 *
 * `--conditions=react-server` is required so `import "server-only"` in
 * the modules this exercises doesn't throw outside Next's bundler — the
 * same technique every prior phase's real-DB test used.
 *
 * This does NOT change any production semantics, ranking, or tier logic.
 * It only seeds fixtures, calls the real discovery functions against the
 * real dev database, prints a human-readable ordering report, asserts a
 * fixed set of invariants, and deletes every fixture it created. Every
 * fixture is prefixed with a unique run id so it's unmistakably
 * identifiable and safe to bulk-delete even if a prior run crashed
 * mid-way (see `cleanupByPrefix` at the bottom).
 *
 * The Google API is never called for real — `GOOGLE_PLACES_API_KEY` is
 * set to a dummy value and `globalThis.fetch` is stubbed at exactly the
 * boundary `lib/google-places/client.ts` calls, so everything above that
 * (search, category discovery, ranking, the cache) runs unmodified
 * against controlled, deterministic Google responses.
 */

process.env.GOOGLE_PLACES_API_KEY = "phase15-eval-key";

import { eq, inArray, like } from "drizzle-orm";

import { db, schema } from "@/db";
import { getBusinessGooglePlaceDetails } from "@/lib/business/queries";
import { getCategoryDiscovery } from "@/lib/search/category-discovery";

const RUN_ID = `p15${Math.random().toString(36).slice(2, 8)}`;
console.log(`\n=== Phase 15 discovery evaluation — run id: ${RUN_ID} ===\n`);

// ─── Fixture place ids (all prefixed, all fake) ────────────────────────────
const PLACE_CONNECTED = `${RUN_ID}_PLACE_CONNECTED`; // case 3: tier 1
const PLACE_SHARED = `${RUN_ID}_PLACE_SHARED`; // cases 4 + 5: multi-business, cross-category
const PLACE_GOOGLE_ONLY = `${RUN_ID}_PLACE_GOOGLE_ONLY`; // case 2
const PLACE_MULTI_CATEGORY = `${RUN_ID}_PLACE_MULTI_CATEGORY`; // case 6
const PLACE_PAGE1_A = `${RUN_ID}_PLACE_PAGE1_A`; // cases 9 + 10 (resurfaces on page 2)
const PLACE_PAGE1_B = `${RUN_ID}_PLACE_PAGE1_B`; // case 9
const PLACE_PAGE2_NEW = `${RUN_ID}_PLACE_PAGE2_NEW`; // case 9
const PLACE_CACHE_FRESH = `${RUN_ID}_PLACE_CACHE_FRESH`; // case 11
const PLACE_CACHE_STALE = `${RUN_ID}_PLACE_CACHE_STALE`; // cases 12 + 13
const PLACE_CACHE_UNAVAILABLE = `${RUN_ID}_PLACE_CACHE_UNAVAILABLE`; // case 14

const PAGE2_TOKEN = `${RUN_ID}_TOKEN_PAGE2`;

function googlePlace(id: string, name: string, types: string[]) {
  return {
    id,
    displayName: { text: name },
    formattedAddress: `${name} address`,
    location: { latitude: 24.09, longitude: 32.9 },
    types,
  };
}

// Text Search candidates, page 1 — every place except PLACE_PAGE2_NEW.
// Deliberately query/category-agnostic (returns the same curated set
// regardless of what text was searched) — this harness tests OUR
// merge/tier/pagination logic, not Google's own relevance matching.
const PAGE1_PLACES = [
  googlePlace(PLACE_CONNECTED, "Connected Cafe", ["cafe"]),
  googlePlace(PLACE_SHARED, "Shared Bakery", ["bakery"]),
  googlePlace(PLACE_GOOGLE_ONLY, "Pure Google Cafe", ["cafe"]),
  googlePlace(PLACE_MULTI_CATEGORY, "Multi Category Place", [
    "hospital",
    "real_estate_agency",
  ]),
  googlePlace(PLACE_PAGE1_A, "Page One Cafe A", ["cafe"]),
  googlePlace(PLACE_PAGE1_B, "Page One Cafe B", ["cafe"]),
];

// Page 2 deliberately RE-includes PLACE_PAGE1_A (case 10 — a place
// resurfacing on a later page) alongside one genuinely new place.
const PAGE2_PLACES = [
  googlePlace(PLACE_PAGE1_A, "Page One Cafe A", ["cafe"]),
  googlePlace(PLACE_PAGE2_NEW, "Page Two Cafe", ["cafe"]),
];

let textSearchCalls = 0;
let detailsCalls: string[] = [];

globalThis.fetch = (async (url: string, init?: RequestInit) => {
  const urlStr = String(url);

  if (urlStr.includes("searchText")) {
    textSearchCalls++;
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const isPage2 = body.pageToken === PAGE2_TOKEN;
    return new Response(
      JSON.stringify({
        places: isPage2 ? PAGE2_PLACES : PAGE1_PLACES,
        nextPageToken: isPage2 ? undefined : PAGE2_TOKEN,
      }),
      { status: 200 },
    );
  }

  // Details endpoint — /places/{placeId}
  const placeId = decodeURIComponent(urlStr.split("/places/")[1]?.split("?")[0] ?? "");
  detailsCalls.push(placeId);

  if (placeId === PLACE_CACHE_STALE) {
    return new Response(JSON.stringify({}), { status: 500 });
  }
  if (placeId === PLACE_CACHE_UNAVAILABLE) {
    return new Response(JSON.stringify({}), { status: 404 });
  }
  return new Response(
    JSON.stringify(googlePlace(placeId, `${placeId} details`, ["cafe"])),
    { status: 200 },
  );
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

async function main() {
// ─── Fixture creation ───────────────────────────────────────────────────
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

async function makeBusiness(
  label: string,
  category: (typeof schema.BUSINESS_CATEGORIES)[number],
  googlePlaceId: string | null = null,
) {
  const [biz] = await db
    .insert(schema.users)
    .values({
      name: `${RUN_ID} ${label}`,
      email: `${RUN_ID}-${label}@example.invalid`,
      emailVerified: true,
      username: `${RUN_ID}-${label}`,
      role: "business_owner",
      status: "active",
      ownerId: owner.id,
    })
    .returning();
  await db.insert(schema.businessBlocks).values({
    businessId: biz.id,
    category,
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

// Case 1 — Qura-only.
const bizQuraOnly = await makeBusiness("qura-only", "food-drinks");

// Case 3 — Qura + Google (tier 1).
const bizConnected = await makeBusiness("connected", "food-drinks", PLACE_CONNECTED);

// Cases 4 + 5 — three businesses, different Qura category than the
// shared place's Google-derived category (food-drinks).
const bizSharedA = await makeBusiness("shared-a", "shopping", PLACE_SHARED);
const bizSharedB = await makeBusiness("shared-b", "beauty", PLACE_SHARED);
const bizSharedC = await makeBusiness("shared-c", "automotive", PLACE_SHARED);

// Case 7 — popular vs. unpopular.
const bizPopular = await makeBusiness("popular", "food-drinks");
const bizUnpopular = await makeBusiness("unpopular", "food-drinks");
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

// Case 8 — equal engagement, deterministic id tie-break. `id` is a
// random UUID (`defaultRandom()` in `db/helpers.ts`), NOT correlated
// with username or creation order, so which of these two ends up
// smaller is only known once both rows exist — the assertion below
// compares the two real ids directly rather than assuming one fixture's
// name implies its id sorts first (a prior version of this assertion
// assumed `tie-aa`'s id would sort before `tie-zz`'s purely from the
// names, which is wrong and made the assertion ~50% flaky).
const bizTieZZ = await makeBusiness("tie-zz", "food-drinks");
const bizTieAA = await makeBusiness("tie-aa", "food-drinks");
const [tieLower, tieHigher] =
  bizTieZZ.id < bizTieAA.id ? [bizTieZZ, bizTieAA] : [bizTieAA, bizTieZZ];

// Cases 11–14 — cache states, businesses only needed to exercise
// `getBusinessGooglePlaceDetails` the same way a profile page would.
const bizCacheFresh = await makeBusiness("cache-fresh", "food-drinks", PLACE_CACHE_FRESH);
const bizCacheStale = await makeBusiness("cache-stale", "food-drinks", PLACE_CACHE_STALE);
const bizCacheUnavailable = await makeBusiness(
  "cache-unavailable",
  "food-drinks",
  PLACE_CACHE_UNAVAILABLE,
);

const now = new Date();
await db.insert(schema.googlePlacesCache).values([
  {
    placeId: PLACE_CACHE_FRESH,
    name: "Fresh Cached Cafe",
    types: ["cafe"],
    fetchedAt: now,
    updatedAt: now,
  },
  {
    placeId: PLACE_CACHE_STALE,
    name: "Stale Cached Cafe",
    types: ["cafe"],
    fetchedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
  },
]);
// PLACE_CACHE_UNAVAILABLE: deliberately NO row — case 14 is "no cache".

console.log("FIXTURES CREATED");
console.log(`  case 1  Qura-only:              @${bizQuraOnly.username}`);
console.log(`  case 3  Qura + Google (tier 1):  @${bizConnected.username} -> ${PLACE_CONNECTED}`);
console.log(`  case 11 fresh cache:             @${bizCacheFresh.username} -> ${PLACE_CACHE_FRESH}`);

try {
  // ── Snapshot the category-original values before any discovery calls,
  // to verify later that nothing wrote them back. ──
  const categoryBefore = new Map(
    [bizSharedA, bizSharedB, bizSharedC].map((b, i) => [
      b.id,
      ["shopping", "beauty", "automotive"][i],
    ]),
  );

  // ── Run 1: unified search ──────────────────────────────────────────
  // NOT exercised live in this harness: `searchUnified` calls
  // `getActiveCity()` internally, which reads Next's `cookies()` — that
  // throws ("called outside a request scope") outside an actual Next
  // request, the same class of limitation Phase 12's report already
  // flagged for `loadMoreCategoryDiscoveryAction`. `getCategoryDiscovery`
  // takes `city` as an explicit parameter instead (no such dependency),
  // which is why every other case below IS exercised live. Unified
  // search's own merge/dedup/pagination logic was already covered by
  // Phase 4/5's dedicated `merge.ts` unit tests (no DB/cookies needed
  // there) — this harness's job is the parts those tests couldn't reach.
  console.log(
    "\nUNIFIED SEARCH: skipped in this harness (searchUnified() requires a live Next.js request scope for getActiveCity(); see the comment above this line in evaluate-discovery.ts).\n",
  );

  // ── Run 2: category discovery (food-drinks) ──────────────────────────
  const catPage1 = await getCategoryDiscovery({ category: "food-drinks", city: "aswan" });
  const catPage2 = catPage1.nextCursor
    ? await getCategoryDiscovery({
        category: "food-drinks",
        city: "aswan",
        cursor: catPage1.nextCursor,
      })
    : { items: [], nextCursor: null };

  printCategoryReport("CATEGORY: food-drinks (page 1)", catPage1.items);
  if (catPage1.nextCursor) {
    printCategoryReport("CATEGORY: food-drinks (page 2)", catPage2.items);
  }

  // ── Run 3: category discovery (health) — case 6, multi-category types ──
  const healthPage = await getCategoryDiscovery({ category: "health", city: "aswan" });
  printCategoryReport("CATEGORY: health (case 6 check)", healthPage.items);

  // ── Run 4: cache states (cases 11–14) ────────────────────────────────
  detailsCalls = [];
  const fresh = await getBusinessGooglePlaceDetails(PLACE_CACHE_FRESH, "en");
  const stale = await getBusinessGooglePlaceDetails(PLACE_CACHE_STALE, "en");
  const unavailable = await getBusinessGooglePlaceDetails(PLACE_CACHE_UNAVAILABLE, "en");

  console.log("\nCACHE STATES\n");
  console.log(`  fresh (case 11):       status=${fresh?.status}`);
  console.log(`  stale (case 12/13):    status=${stale?.status}  reason=${stale && "reason" in stale ? stale.reason : "-"}`);
  console.log(`  unavailable (case 14): status=${unavailable?.status}  reason=${unavailable && "reason" in unavailable ? unavailable.reason : "-"}`);

  // ══════════════════════════════════════════════════════════════════
  // INVARIANTS
  // ══════════════════════════════════════════════════════════════════
  console.log("\n=== INVARIANTS ===\n");

  const allCatItems = [...catPage1.items, ...catPage2.items];

  // No duplicate businesses / places within category discovery.
  const catBusinessIds = allCatItems.flatMap((r) =>
    r.kind === "qura" ? [r.business.id] : r.kind === "both" ? r.businesses.map((b) => b.id) : [],
  );
  assert(
    catBusinessIds.length === new Set(catBusinessIds).size,
    "category discovery: no business appears twice across page 1 + page 2",
  );
  const catPlaceIds = allCatItems
    .filter((r) => r.kind !== "qura")
    .map((r) => (r as { place: { placeId: string } }).place.placeId);
  assert(
    catPlaceIds.length === new Set(catPlaceIds).size,
    "category discovery: no Google place appears twice across page 1 + page 2 (case 10)",
  );
  assert(
    !catPlaceIds.includes(PLACE_PAGE1_A) || catPage1.items.some((r) => r.kind !== "qura" && (r as { place: { placeId: string } }).place.placeId === PLACE_PAGE1_A),
    "category discovery: PLACE_PAGE1_A (deliberately repeated by the stub) only counted once, on page 1",
  );

  // All businesses sharing PLACE_SHARED survive (case 4).
  const sharedGroup = catPage1.items.find(
    (r) => r.kind === "both" && r.place.placeId === PLACE_SHARED,
  );
  assert(!!sharedGroup, "PLACE_SHARED surfaces as a 'both' group");
  if (sharedGroup && sharedGroup.kind === "both") {
    const ids = sharedGroup.businesses.map((b) => b.id).sort();
    const expected = [bizSharedA.id, bizSharedB.id, bizSharedC.id].sort();
    assert(
      JSON.stringify(ids) === JSON.stringify(expected),
      "all three businesses connected to PLACE_SHARED are present, none dropped (case 4)",
    );
  }

  // Qura category never changes (case 5's own businesses, re-read from DB).
  const rereadBlocks = await db.query.businessBlocks.findMany({
    where: inArray(schema.businessBlocks.businessId, [
      bizSharedA.id,
      bizSharedB.id,
      bizSharedC.id,
    ]),
  });
  const categoryUnchanged = rereadBlocks.every(
    (b) => b.category === categoryBefore.get(b.businessId),
  );
  assert(
    categoryUnchanged,
    "Qura category on business_blocks is untouched by discovery (case 5's own-category != google-derived-category businesses)",
  );

  // Google-derived category is discovery-only: bizSharedA/B/C's `via` on
  // the food-drinks page must be "google_type", never "category".
  if (sharedGroup && sharedGroup.kind === "both") {
    assert(
      sharedGroup.businesses.every((b) => b.via === "google_type"),
      "Google-derived category match is labeled 'google_type', never 'category' (never implies Qura reclassified it)",
    );
  }

  // Tier ordering intact + ranking only within a tier.
  const tierOf = (r: (typeof catPage1.items)[number]): 1 | 2 | 3 | 4 =>
    r.kind === "qura"
      ? r.business.googlePlaceIds.length > 0
        ? 1
        : 2
      : r.kind === "both"
        ? 3
        : 4;
  const tiers = catPage1.items.map(tierOf);
  const isNonDecreasing = tiers.every((t, i) => i === 0 || t >= tiers[i - 1]);
  assert(isNonDecreasing, "tier ordering is non-decreasing across page 1 (1 <= 2 <= 3 <= 4)");

  const popularIdx = catPage1.items.findIndex(
    (r) => r.kind === "qura" && r.business.id === bizPopular.id,
  );
  const unpopularIdx = catPage1.items.findIndex(
    (r) => r.kind === "qura" && r.business.id === bizUnpopular.id,
  );
  assert(
    popularIdx !== -1 && unpopularIdx !== -1 && popularIdx < unpopularIdx,
    "ranking within tier 2: business with real reviews/follows ranks above one with none (case 7)",
  );

  const tieLowerIdx = catPage1.items.findIndex(
    (r) => r.kind === "qura" && r.business.id === tieLower.id,
  );
  const tieHigherIdx = catPage1.items.findIndex(
    (r) => r.kind === "qura" && r.business.id === tieHigher.id,
  );
  assert(
    tieLowerIdx !== -1 && tieHigherIdx !== -1 && tieLowerIdx < tieHigherIdx,
    `equal engagement -> deterministic id-ascending tie-break (case 8: @${tieLower.username} (lower id) before @${tieHigher.username})`,
  );

  // Case 6 — multi-category: PLACE_MULTI_CATEGORY appears under BOTH
  // "health" and NOT under "food-drinks" (its types don't map there).
  assert(
    healthPage.items.some((r) => r.kind !== "qura" && r.place.placeId === PLACE_MULTI_CATEGORY),
    "a place with multiple Google types (hospital + real_estate_agency) appears under 'health' (case 6)",
  );
  assert(
    !catPage1.items.some((r) => r.kind !== "qura" && r.place.placeId === PLACE_MULTI_CATEGORY),
    "that same place does NOT appear under 'food-drinks' -- no fuzzy fallback (case 6)",
  );

  // Pagination doesn't resurrect entities already shown — the dedicated
  // check is the PLACE_PAGE1_A resurfacing-attempt assertions above
  // (case 10: the stub deliberately repeats it on page 2).

  // Stale/unavailable never implies disconnection.
  const staleConnected = await db.query.businessGooglePlaces.findFirst({
    where: eq(schema.businessGooglePlaces.businessId, bizCacheStale.id),
  });
  const unavailableConnected = await db.query.businessGooglePlaces.findFirst({
    where: eq(schema.businessGooglePlaces.businessId, bizCacheUnavailable.id),
  });
  assert(
    staleConnected?.googlePlaceId === PLACE_CACHE_STALE,
    "a business with STALE Google data remains connected (googlePlaceId untouched, case 12/13)",
  );
  assert(
    unavailableConnected?.googlePlaceId === PLACE_CACHE_UNAVAILABLE,
    "a business with UNAVAILABLE Google data remains connected (googlePlaceId untouched, case 14)",
  );
  assert(stale?.status === "stale", "cache correctly reports 'stale' for case 12/13's business");
  assert(
    unavailable?.status === "unavailable",
    "cache correctly reports 'unavailable' for case 14's business",
  );
  assert(
    fresh?.status === "fresh" && !detailsCalls.includes(PLACE_CACHE_FRESH),
    "a FRESH cache entry serves without any Google Details call (case 11)",
  );

  // Cache doesn't affect unified search / category discovery behavior —
  // neither module ever calls getGooglePlaceDetails or reads
  // `google_places` at all (true by construction; checked here by
  // confirming none of the Details calls made during the cache-state run
  // correspond to any place touched by search/category discovery).
  const discoveryPlaceIds = new Set(
    allCatItems
      .filter((r) => r.kind !== "qura")
      .map((r) => (r as { place: { placeId: string } }).place.placeId),
  );
  assert(
    ![...discoveryPlaceIds].some((id) => detailsCalls.includes(id as string)),
    "no Details call was made for any place search/category discovery touched -- cache is fully decoupled from discovery",
  );
  // 3 Text Search calls total: category discovery (food-drinks) page 1 +
  // page 2, plus the separate "health" run.
  assert(
    textSearchCalls >= 3,
    `at least 3 Text Search calls made across all discovery runs (actual: ${textSearchCalls}) -- confirms category discovery made its own live-looking call each time, never skipped`,
  );
} finally {
  // ══════════════════════════════════════════════════════════════════
  // CLEANUP — delete every fixture this run created, then verify.
  // ══════════════════════════════════════════════════════════════════
  console.log("\n=== CLEANUP ===\n");

  const placeIds = [
    PLACE_CONNECTED,
    PLACE_SHARED,
    PLACE_GOOGLE_ONLY,
    PLACE_MULTI_CATEGORY,
    PLACE_PAGE1_A,
    PLACE_PAGE1_B,
    PLACE_PAGE2_NEW,
    PLACE_CACHE_FRESH,
    PLACE_CACHE_STALE,
    PLACE_CACHE_UNAVAILABLE,
  ];

  await db
    .delete(schema.googlePlaceClaimConflicts)
    .where(inArray(schema.googlePlaceClaimConflicts.googlePlaceId, placeIds));
  await db.delete(schema.googlePlacesCache).where(inArray(schema.googlePlacesCache.placeId, placeIds));
  // Deleting `owner` cascades: every business it owns (ownerId FK,
  // cascade) -> each business's business_blocks/business_reviews/follows
  // rows (all cascade too) -> the reviewer accounts are separate (never
  // owned by `owner`) and deleted explicitly.
  await db.delete(schema.users).where(eq(schema.users.id, owner.id));
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
  if (failed > 0) process.exitCode = 1;
}
}

main()
  .catch((err) => {
    console.error("Evaluation crashed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());

// ─── Report printing ────────────────────────────────────────────────────
//
// `printSearchReport` isn't called by `main()` right now — `searchUnified`
// itself isn't exercised live in this harness (see the comment where it
// would have been called, above). Kept here, ready to use, for whenever
// a future harness run can supply a Next.js request scope (or the
// production code is changed to accept `city` as an explicit parameter
// the way `getCategoryDiscovery` already does).

function printCategoryReport(
  title: string,
  items: Awaited<ReturnType<typeof getCategoryDiscovery>>["items"],
) {
  console.log(`\n${title}\n`);
  if (items.length === 0) {
    console.log("  (no results)");
    return;
  }

  const tierLabel = { 1: "Tier 1", 2: "Tier 2", 3: "Tier 3", 4: "Tier 4" } as const;
  let currentTier: number | null = null;
  let n = 0;

  for (const r of items) {
    const tier =
      r.kind === "qura" ? (r.business.googlePlaceIds.length > 0 ? 1 : 2) : r.kind === "both" ? 3 : 4;
    if (tier !== currentTier) {
      currentTier = tier;
      n = 0;
      console.log(`\n${tierLabel[tier as 1 | 2 | 3 | 4]}`);
    }
    n++;
    if (r.kind === "qura") {
      console.log(`  ${n}. ${r.business.name} (@${r.business.username}) via=${r.business.via}`);
    } else if (r.kind === "both") {
      console.log(
        `  ${n}. ${r.place.name} -- ${r.businesses.length} business(es): ${r.businesses
          .map((b) => `@${b.username} (${b.via})`)
          .join(", ")}`,
      );
    } else {
      console.log(`  ${n}. ${r.place.name} (Google-only)`);
    }
  }
  console.log("");
}
