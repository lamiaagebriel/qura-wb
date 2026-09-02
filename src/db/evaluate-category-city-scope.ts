/**
 * Phase 23 — controlled, disposable evaluation harness for
 * `getCategoryDiscovery()`'s city scoping and per-category Google
 * discovery, specifically the gap this phase closed: a business
 * connected to a Google place but registered in a DIFFERENT city than
 * the one being browsed must never surface inside that city's grouped
 * (`"both"`) result — `unified-search.ts` already enforced this (Phase
 * 18), `category-discovery.ts` didn't until this phase. Also exercises a
 * representative slice of `BUSINESS_CATEGORIES` end to end (Qura-only,
 * Google-only, and connected), since one category's Google type mapping
 * working is not evidence every category's does.
 *
 *   npx tsx --conditions=react-server --env-file=.env src/db/evaluate-category-city-scope.ts
 *   (or: pnpm db:evaluate-category-city-scope)
 *
 * Same conventions as every other `evaluate-*.ts` harness: real Postgres,
 * Google stubbed at the `fetch` boundary (query text is ignored by the
 * stub, same as `evaluate-discovery.ts` — `getCategoryDiscovery`'s own
 * `mapGoogleTypesToQuraCategories` filtering is what actually determines
 * which candidates belong to which category, not the stub), fixtures
 * prefixed by a unique run id, full cleanup + before/after snapshot.
 */

process.env.GOOGLE_PLACES_API_KEY = "phase23-eval-key";

import { eq, inArray, like } from "drizzle-orm";

import { db, schema } from "@/db";
import type { BusinessCategory, CityId } from "@/db/schema";
import { getCategoryDiscovery } from "@/lib/search/category-discovery";

const RUN_ID = `p23${Math.random().toString(36).slice(2, 8)}`;
console.log(`\n=== Phase 23 category/city-scope evaluation — run id: ${RUN_ID} ===\n`);

// One confident, unambiguous Google type per representative category —
// same source (`google-category-mapping.ts`) every other harness/UI code
// trusts, picked so each maps to exactly the category under test (no
// cross-category signal to confuse the assertions).
const REPRESENTATIVE_CATEGORIES: { category: BusinessCategory; googleType: string }[] = [
  { category: "food-drinks", googleType: "restaurant" },
  { category: "health", googleType: "doctor" },
  { category: "beauty", googleType: "beauty_salon" },
  { category: "shopping", googleType: "shopping_mall" },
  { category: "automotive", googleType: "car_repair" },
  { category: "education", googleType: "school" },
  { category: "tourism", googleType: "hotel" },
  { category: "professional-services", googleType: "lawyer" },
  { category: "real-estate", googleType: "real_estate_agency" },
  { category: "events", googleType: "event_venue" },
  { category: "emergency", googleType: "police" },
  { category: "lifestyle", googleType: "gym" },
];

function googlePlace(id: string, name: string, types: string[]) {
  return {
    id,
    displayName: { text: name },
    formattedAddress: `${name} address`,
    location: { latitude: 24.09, longitude: 32.9 },
    types,
  };
}

let textSearchCalls = 0;
const ALL_STUB_PLACES: ReturnType<typeof googlePlace>[] = [];

globalThis.fetch = (async (url: string) => {
  const urlStr = String(url);
  if (urlStr.includes("searchText")) {
    textSearchCalls++;
    // Query-agnostic, same as `evaluate-discovery.ts` — this harness
    // tests OUR per-category filtering (`mapGoogleTypesToQuraCategories`
    // + the city filter this phase added), not Google's relevance
    // matching, so every call returns the same full curated set.
    return new Response(JSON.stringify({ places: ALL_STUB_PLACES, nextPageToken: undefined }), {
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

async function snapshot() {
  const [users, blocks, reviews, follows, places, conflicts] = await Promise.all([
    db.$count(schema.users),
    db.$count(schema.businessBlocks),
    db.$count(schema.businessReviews),
    db.$count(schema.follows),
    db.$count(schema.googlePlacesCache),
    db.$count(schema.googlePlaceClaimConflicts),
  ]);
  return { users, blocks, reviews, follows, places, conflicts };
}

async function main() {
  const before = await snapshot();

  const [owner] = await db
    .insert(schema.users)
    .values({
      name: `${RUN_ID} Owner`,
      email: `${RUN_ID}_owner@example.invalid`,
      emailVerified: true,
      username: `${RUN_ID}_owner`,
      role: "business_owner",
      status: "active",
    })
    .returning();

  async function makeBusiness(
    label: string,
    category: BusinessCategory,
    city: CityId,
    googlePlaceId: string | null = null,
  ) {
    const [biz] = await db
      .insert(schema.users)
      .values({
        name: `${RUN_ID} ${label}`,
        email: `${RUN_ID}_${label}@example.invalid`,
        emailVerified: true,
        username: `${RUN_ID}_${label}`,
        role: "business_owner",
        status: "active",
        ownerId: owner.id,
      })
      .returning();
    await db.insert(schema.businessBlocks).values({
      businessId: biz.id,
      category,
      data: {},
      city,
    });
    if (googlePlaceId) {
      await db.insert(schema.businessGooglePlaces).values({ businessId: biz.id, googlePlaceId });
    }
    return biz;
  }

  const createdBusinessIds: string[] = [];
  const placeIds: string[] = [];

  try {
    // ═══════════════════════════════════════════════════════════════
    // Representative category coverage — Qura-only, Google-only, and
    // connected, for each of 12 categories.
    // ═══════════════════════════════════════════════════════════════
    for (const { category, googleType } of REPRESENTATIVE_CATEGORIES) {
      const quraPlaceId = `${RUN_ID}_${category}_qura_only`;
      const googleOnlyPlaceId = `${RUN_ID}_${category}_google_only`;
      const connectedPlaceId = `${RUN_ID}_${category}_connected`;

      const quraBiz = await makeBusiness(`${category}_qura`, category, "aswan");
      createdBusinessIds.push(quraBiz.id);

      const connectedBiz = await makeBusiness(`${category}_conn`, category, "aswan", connectedPlaceId);
      createdBusinessIds.push(connectedBiz.id);

      ALL_STUB_PLACES.push(
        googlePlace(googleOnlyPlaceId, `${RUN_ID} ${category} Google Only`, [googleType]),
        googlePlace(connectedPlaceId, `${RUN_ID} ${category} Connected`, [googleType]),
      );
      placeIds.push(quraPlaceId, googleOnlyPlaceId, connectedPlaceId);

      const page = await getCategoryDiscovery({ category, city: "aswan" });

      const hasQuraOnly = page.items.some(
        (r) => r.kind === "qura" && r.business.id === quraBiz.id,
      );
      assert(hasQuraOnly, `[${category}] Qura-authoritative business appears (tier 2)`);

      const hasGoogleOnly = page.items.some(
        (r) => r.kind === "google" && r.place.placeId === googleOnlyPlaceId,
      );
      assert(hasGoogleOnly, `[${category}] Google-only place (type "${googleType}") appears (tier 4)`);

      const connectedGroup = page.items.find(
        (r) => r.kind === "both" && r.place.placeId === connectedPlaceId,
      );
      const connectedAsQura = page.items.find(
        (r) => r.kind === "qura" && r.business.id === connectedBiz.id,
      );
      // Rule A's dedup: a business whose OWN category already matches is
      // always emitted as `kind: "qura"` (tier 1, since it's connected),
      // never grouped into `"both"` — see `category-discovery.ts`'s own
      // doc comment on this. So the connected fixture here (created WITH
      // this exact category) is expected as tier 1, not `"both"`.
      assert(
        !connectedGroup && !!connectedAsQura,
        `[${category}] business with matching Qura category + Google connection appears as tier 1 "qura" (not "both")`,
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // City isolation — Aswan Qura Restaurant A / Google Restaurant A vs
    // Luxor Qura Restaurant B / Google Restaurant B, all food-drinks.
    // ═══════════════════════════════════════════════════════════════
    const quraA = await makeBusiness("city_qura_a", "food-drinks", "aswan");
    const quraB = await makeBusiness("city_qura_b", "food-drinks", "luxor");
    createdBusinessIds.push(quraA.id, quraB.id);

    const googlePlaceA = `${RUN_ID}_city_google_a`;
    const googlePlaceB = `${RUN_ID}_city_google_b`;
    ALL_STUB_PLACES.push(
      googlePlace(googlePlaceA, `${RUN_ID} City Google A`, ["restaurant"]),
      googlePlace(googlePlaceB, `${RUN_ID} City Google B`, ["restaurant"]),
    );
    placeIds.push(googlePlaceA, googlePlaceB);

    const aswanPage = await getCategoryDiscovery({ category: "food-drinks", city: "aswan" });
    const luxorPage = await getCategoryDiscovery({ category: "food-drinks", city: "luxor" });

    assert(
      aswanPage.items.some((r) => r.kind === "qura" && r.business.id === quraA.id) &&
        !aswanPage.items.some((r) => r.kind === "qura" && r.business.id === quraB.id),
      "city isolation: Aswan's food-drinks page shows Aswan's Qura business, not Luxor's",
    );
    assert(
      luxorPage.items.some((r) => r.kind === "qura" && r.business.id === quraB.id) &&
        !luxorPage.items.some((r) => r.kind === "qura" && r.business.id === quraA.id),
      "city isolation: Luxor's food-drinks page shows Luxor's Qura business, not Aswan's",
    );
    assert(
      aswanPage.items.some((r) => r.kind === "google" && r.place.placeId === googlePlaceA) &&
        aswanPage.items.some((r) => r.kind === "google" && r.place.placeId === googlePlaceB),
      "Google-only candidates are query/city-text-scoped, not hard-filtered by city (both stub places visible; matches unified search's existing text-bias approach, not a geo filter)",
    );

    // ═══════════════════════════════════════════════════════════════
    // Multi-business Google place spanning cities — the actual bug this
    // phase fixes: A (Aswan) + B (Aswan) + C (Luxor) all connected to
    // ONE place, category set to something OTHER than each business's
    // own category so they only surface via the "both" grouping (rule
    // B/`google_type`), not rule A.
    // ═══════════════════════════════════════════════════════════════
    const multiPlaceId = `${RUN_ID}_multi_place`;
    ALL_STUB_PLACES.push(googlePlace(multiPlaceId, `${RUN_ID} Multi Place`, ["restaurant"]));
    placeIds.push(multiPlaceId);

    const multiA = await makeBusiness("multi_a", "shopping", "aswan", multiPlaceId);
    const multiB = await makeBusiness("multi_b", "beauty", "aswan", multiPlaceId);
    const multiC = await makeBusiness("multi_c", "automotive", "luxor", multiPlaceId);
    createdBusinessIds.push(multiA.id, multiB.id, multiC.id);

    const multiAswan = await getCategoryDiscovery({ category: "food-drinks", city: "aswan" });
    const multiLuxor = await getCategoryDiscovery({ category: "food-drinks", city: "luxor" });

    const aswanGroup = multiAswan.items.find(
      (r) => r.kind === "both" && r.place.placeId === multiPlaceId,
    );
    assert(!!aswanGroup, "multi-business place: Aswan's food-drinks page shows the grouped 'both' result");
    if (aswanGroup && aswanGroup.kind === "both") {
      const ids = aswanGroup.businesses.map((b) => b.id).sort();
      assert(
        JSON.stringify(ids) === JSON.stringify([multiA.id, multiB.id].sort()),
        `multi-business place, Aswan: group contains exactly A and B, never C (Luxor) — got ${ids.length} businesses`,
      );
    }

    const luxorGroup = multiLuxor.items.find(
      (r) => r.kind === "both" && r.place.placeId === multiPlaceId,
    );
    assert(!!luxorGroup, "multi-business place: Luxor's food-drinks page shows the grouped 'both' result");
    if (luxorGroup && luxorGroup.kind === "both") {
      const ids = luxorGroup.businesses.map((b) => b.id);
      assert(
        JSON.stringify(ids) === JSON.stringify([multiC.id]),
        `multi-business place, Luxor: group contains exactly C, never A or B (Aswan) — got ${ids.length} businesses`,
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // Tier ordering + engagement ranking still intact after the fix.
    // ═══════════════════════════════════════════════════════════════
    const tierOf = (r: (typeof multiAswan.items)[number]): 1 | 2 | 3 | 4 =>
      r.kind === "qura" ? (r.business.googlePlaceIds.length > 0 ? 1 : 2) : r.kind === "both" ? 3 : 4;
    const tiers = multiAswan.items.map(tierOf);
    assert(
      tiers.every((t, i) => i === 0 || t >= tiers[i - 1]),
      "tier ordering remains non-decreasing (1 <= 2 <= 3 <= 4) after the city-scope fix",
    );
  } finally {
    console.log("\n=== CLEANUP ===\n");

    await db
      .delete(schema.googlePlaceClaimConflicts)
      .where(inArray(schema.googlePlaceClaimConflicts.googlePlaceId, placeIds));
    await db.delete(schema.users).where(eq(schema.users.id, owner.id));
    if (createdBusinessIds.length > 0) {
      await db.delete(schema.users).where(inArray(schema.users.id, createdBusinessIds));
    }

    const leftover = await db.query.users.findMany({
      where: like(schema.users.username, `${RUN_ID}%`),
    });
    assert(leftover.length === 0, `no fixture rows remain with the '${RUN_ID}' prefix after cleanup`);

    const after = await snapshot();
    assert(
      JSON.stringify(before) === JSON.stringify(after),
      `final row counts match pre-run snapshot (before=${JSON.stringify(before)}, after=${JSON.stringify(after)})`,
    );

    console.log(`\nText Search calls made: ${textSearchCalls}`);
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
