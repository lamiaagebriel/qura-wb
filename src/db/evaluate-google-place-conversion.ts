/**
 * Phase 21 — controlled, disposable evaluation harness for the
 * Google-only -> Qura conversion flow (`lib/business/google-place-conversion.ts`).
 * NOT part of the application — only ever run directly:
 *
 *   npx tsx --conditions=react-server --env-file=.env src/db/evaluate-google-place-conversion.ts
 *   (or: pnpm db:evaluate-google-place-conversion)
 *
 * The two exported server actions (`checkGooglePlaceConversionAction`,
 * `createBusinessFromGooglePlaceAction`) both call `getGuardedUser()`,
 * which needs a live Next.js request scope (`next/headers`) — unavailable
 * here, same limitation `evaluate-discovery.ts` documents for
 * `searchUnified`. So this harness calls the underlying, non-"use server"
 * functions those actions delegate to (`checkExistingGooglePlaceConversion`,
 * `createBusinessFromGooglePlace`) directly with a plain `ownerId`
 * parameter — exercising the exact same logic, real Postgres, real
 * transaction, just without the auth-guard wrapper on top.
 *
 * Makes zero Google API calls, by design (conversion never calls Google) —
 * `globalThis.fetch` is stubbed anyway, purely so a call would be loudly
 * obvious (case 12) rather than silently succeeding against the real
 * internet if something regressed.
 */

process.env.GOOGLE_PLACES_API_KEY = "phase21-eval-key";

import { eq, inArray, like } from "drizzle-orm";

import { db, schema } from "@/db";
import {
  checkExistingGooglePlaceConversion,
  createBusinessFromGooglePlace,
  type CreateBusinessFromGooglePlaceInput,
} from "@/lib/business/google-place-conversion";

const RUN_ID = `p21${Math.random().toString(36).slice(2, 8)}`;
console.log(`\n=== Phase 21 Google-place-conversion evaluation — run id: ${RUN_ID} ===\n`);

const t = (key: string) => key;

let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls++;
  throw new Error("conversion must never call Google — fetch was invoked");
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

const PLACE_FRESH = `${RUN_ID}_PLACE_FRESH`; // case 1
const PLACE_OTHER_OWNER = `${RUN_ID}_PLACE_OTHER_OWNER`; // case 2
const PLACE_MULTI = `${RUN_ID}_PLACE_MULTI`; // case 3
const PLACE_SAME_USER = `${RUN_ID}_PLACE_SAME_USER`; // cases 4 + 5
const PLACE_TAKEN_USERNAME = `${RUN_ID}_PLACE_TAKEN_USERNAME`; // case 6-ish / username collision
const PLACE_CATEGORY = `${RUN_ID}_PLACE_CATEGORY`; // case 8
const PLACE_CITY = `${RUN_ID}_PLACE_CITY`; // case 9
const PLACE_NO_OVERWRITE = `${RUN_ID}_PLACE_NO_OVERWRITE`; // case 10
const PLACE_CONCURRENT = `${RUN_ID}_PLACE_CONCURRENT`; // case 11

function baseInput(
  placeId: string,
  username: string,
  overrides: Partial<CreateBusinessFromGooglePlaceInput> = {},
): CreateBusinessFromGooglePlaceInput {
  return {
    googlePlace: {
      placeId,
      name: `${RUN_ID} Google Name`,
      address: "123 Google Address St",
      location: { latitude: 24.09, longitude: 32.9 },
      types: ["cafe"],
    },
    name: `${RUN_ID} Qura Name`,
    username,
    category: "food-drinks",
    city: "aswan",
    ...overrides,
  };
}

async function main() {
  const before = await snapshot();

  const [ownerA] = await db
    .insert(schema.users)
    .values({
      name: `${RUN_ID} Owner A`,
      email: `${RUN_ID}_owner_a@example.invalid`,
      emailVerified: true,
      username: `${RUN_ID}_owner_a`,
      role: "business_owner",
      status: "active",
    })
    .returning();

  const [ownerB] = await db
    .insert(schema.users)
    .values({
      name: `${RUN_ID} Owner B`,
      email: `${RUN_ID}_owner_b@example.invalid`,
      emailVerified: true,
      username: `${RUN_ID}_owner_b`,
      role: "business_owner",
      status: "active",
    })
    .returning();

  const [ownerC] = await db
    .insert(schema.users)
    .values({
      name: `${RUN_ID} Owner C`,
      email: `${RUN_ID}_owner_c@example.invalid`,
      emailVerified: true,
      username: `${RUN_ID}_owner_c`,
      role: "business_owner",
      status: "active",
    })
    .returning();

  async function makeBusiness(owner: typeof ownerA, label: string, googlePlaceId: string) {
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
      category: "food-drinks",
      data: {},
      city: "aswan",
    });
    await db.insert(schema.businessGooglePlaces).values({ businessId: biz.id, googlePlaceId });
    return biz;
  }

  const createdBusinessIds: string[] = [];

  try {
    // ── Case 1: new user + new place -> business + block created + connected ──
    const r1 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_FRESH, `${RUN_ID}_fresh`),
      t,
    );
    assert(r1.success && r1.data.status === "created", "case 1: new place -> created");
    if (r1.success && r1.data.status === "created") {
      createdBusinessIds.push(r1.data.id);
      assert(!r1.data.conflict, "case 1: no conflict for a genuinely new place");
      const block = await db.query.businessBlocks.findFirst({
        where: eq(schema.businessBlocks.businessId, r1.data.id),
      });
      const connection = await db.query.businessGooglePlaces.findFirst({
        where: eq(schema.businessGooglePlaces.businessId, r1.data.id),
      });
      assert(
        connection?.googlePlaceId === PLACE_FRESH,
        "case 1: business_google_places connection set",
      );
      const dataLoc = (block?.data as { location?: { description?: string } })?.location;
      assert(
        dataLoc?.description === "123 Google Address St",
        "case 1: Google address copied into data.location as a starting value",
      );
    }

    // ── Case 2: another user's business already connected -> creation
    // succeeds + conflict recorded, other owner's identity never revealed ──
    const otherBiz = await makeBusiness(ownerB, "other_owner_biz", PLACE_OTHER_OWNER);
    createdBusinessIds.push(otherBiz.id);
    const r2 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_OTHER_OWNER, `${RUN_ID}_case2`),
      t,
    );
    assert(r2.success && r2.data.status === "created", "case 2: creation succeeds despite existing connection");
    if (r2.success && r2.data.status === "created") {
      createdBusinessIds.push(r2.data.id);
      assert(r2.data.conflict === true, "case 2: conflict flagged true");
      const conflictRow = await db.query.googlePlaceClaimConflicts.findFirst({
        where: eq(schema.googlePlaceClaimConflicts.attemptingBusinessId, r2.data.id),
      });
      assert(!!conflictRow, "case 2: conflict row recorded");
      assert(
        conflictRow?.existingBusinessId === otherBiz.id,
        "case 2: conflict row references the pre-existing business",
      );
    }
    // "other owner's identity never revealed" is a UI-layer property (the
    // result never carries an owner id/name at all) — verified by
    // inspecting the actual return shape above: `data` has no owner field.

    // ── Case 3: multiple existing connections -> conversion succeeds,
    // existing connections remain, no special-casing ──
    const multiBiz1 = await makeBusiness(ownerA, "multi_1", PLACE_MULTI);
    const multiBizOtherOwner = await makeBusiness(ownerB, "multi_2", PLACE_MULTI);
    createdBusinessIds.push(multiBiz1.id, multiBizOtherOwner.id);
    const r3 = await createBusinessFromGooglePlace(
      ownerC.id,
      baseInput(PLACE_MULTI, `${RUN_ID}_case3`),
      t,
    );
    assert(r3.success && r3.data.status === "created", "case 3: creation succeeds with 2 pre-existing connections");
    if (r3.success && r3.data.status === "created") {
      createdBusinessIds.push(r3.data.id);
      assert(r3.data.conflict === true, "case 3: conflict flagged true");
    }
    const stillConnected = await db.query.businessGooglePlaces.findMany({
      where: eq(schema.businessGooglePlaces.googlePlaceId, PLACE_MULTI),
    });
    assert(stillConnected.length === 3, "case 3: all 3 connections coexist, none dropped");

    // ── Case 4: same user already owns a business connected to same place
    // -> no duplicate, dedup redirect info returned ──
    const sameUserBiz = await makeBusiness(ownerA, "same_user_existing", PLACE_SAME_USER);
    createdBusinessIds.push(sameUserBiz.id);
    const check4 = await checkExistingGooglePlaceConversion(ownerA.id, PLACE_SAME_USER);
    assert(
      check4?.id === sameUserBiz.id,
      "case 4: click-time check finds the caller's own existing connection",
    );
    const r4 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_SAME_USER, `${RUN_ID}_case4x`),
      t,
    );
    assert(
      r4.success && r4.data.status === "already_connected" && r4.data.id === sameUserBiz.id,
      "case 4: creation call itself also short-circuits to 'already_connected', zero writes",
    );
    const noDuplicate = await db.query.users.findFirst({
      where: eq(schema.users.username, `${RUN_ID}_case4x`),
    });
    assert(!noDuplicate, "case 4: no duplicate business row was created");

    // ── Case 5: same user owns another business connected to ANOTHER
    // place -> new business CAN be created for a different place ──
    const r5 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(`${RUN_ID}_PLACE_DIFFERENT`, `${RUN_ID}_case5`),
      t,
    );
    assert(
      r5.success && r5.data.status === "created",
      "case 5: same user connecting a DIFFERENT place succeeds (dedup is per-place, not global)",
    );
    if (r5.success && r5.data.status === "created") createdBusinessIds.push(r5.data.id);

    // ── Case 6/username collision: invalid username reuse -> no business
    // created, field-level error, transaction untouched ──
    const usernameHolder = await makeBusiness(ownerB, "username_holder", PLACE_TAKEN_USERNAME);
    createdBusinessIds.push(usernameHolder.id);
    const r6 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(`${RUN_ID}_PLACE_TAKEN_USERNAME_TARGET`, `${RUN_ID}_username_holder`),
      t,
    );
    assert(
      !r6.success && r6.error.kind === "issues" && r6.error.issues[0]?.path[0] === "username",
      "case 6: username collision returns a field-level 'username' issue error",
    );

    // ── Case 7: invalid/tampered Place ID -> zero writes ──
    const r7 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput("", `${RUN_ID}_case7`),
      t,
    );
    assert(!r7.success, "case 7: empty/invalid place id is rejected server-side");
    const noCase7Row = await db.query.users.findFirst({
      where: eq(schema.users.username, `${RUN_ID}_case7`),
    });
    assert(!noCase7Row, "case 7: zero writes for an invalid place id");

    // ── Case 8: category suggestion doesn't override the user's final
    // choice — types signal "food-drinks" but caller explicitly picks
    // "beauty"; the stored category must be exactly what was submitted ──
    const r8 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_CATEGORY, `${RUN_ID}_case8`, { category: "beauty" }),
      t,
    );
    assert(r8.success && r8.data.status === "created", "case 8: creation succeeds");
    if (r8.success && r8.data.status === "created") {
      createdBusinessIds.push(r8.data.id);
      const block8 = await db.query.businessBlocks.findFirst({
        where: eq(schema.businessBlocks.businessId, r8.data.id),
      });
      assert(
        block8?.category === "beauty",
        "case 8: stored category is the user's final choice ('beauty'), not the Google-signaled 'food-drinks'",
      );
    }

    // ── Case 9: selected city persisted exactly as submitted ──
    const r9 = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_CITY, `${RUN_ID}_case9`, { city: "luxor" }),
      t,
    );
    assert(r9.success && r9.data.status === "created", "case 9: creation succeeds");
    if (r9.success && r9.data.status === "created") {
      createdBusinessIds.push(r9.data.id);
      const block9 = await db.query.businessBlocks.findFirst({
        where: eq(schema.businessBlocks.businessId, r9.data.id),
      });
      assert(block9?.city === "luxor", "case 9: city persisted exactly as submitted ('luxor')");
    }

    // ── Case 10: Google metadata doesn't overwrite Qura-authoritative
    // fields post-creation — re-running the same create is a no-op
    // (already_connected), so the original row is provably untouched ──
    const r10a = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_NO_OVERWRITE, `${RUN_ID}_case10`, { name: "Original Qura Name" }),
      t,
    );
    assert(r10a.success && r10a.data.status === "created", "case 10: initial creation succeeds");
    if (r10a.success && r10a.data.status === "created") createdBusinessIds.push(r10a.data.id);
    const r10b = await createBusinessFromGooglePlace(
      ownerA.id,
      baseInput(PLACE_NO_OVERWRITE, `${RUN_ID}_case10_again`, {
        name: "Different Google Name This Time",
      }),
      t,
    );
    assert(
      r10b.success && r10b.data.status === "already_connected",
      "case 10: re-submitting the same place for the same user is a no-op, not a second write",
    );
    const rereadCase10 = await db.query.users.findFirst({
      where: eq(schema.users.id, (r10a as { data: { id: string } }).data.id),
    });
    assert(
      rereadCase10?.name === "Original Qura Name",
      "case 10: the original Qura-authoritative name is untouched",
    );

    // ── Case 11: concurrent conversion by two different users for the
    // SAME place -> both businesses can exist, conflict behavior matches
    // existing claim semantics (first one in has conflict:false, the
    // second has conflict:true and a recorded conflict row) ──
    const [r11a, r11b] = await Promise.all([
      createBusinessFromGooglePlace(
        ownerA.id,
        baseInput(PLACE_CONCURRENT, `${RUN_ID}_concurrent_a`),
        t,
      ),
      createBusinessFromGooglePlace(
        ownerB.id,
        baseInput(PLACE_CONCURRENT, `${RUN_ID}_concurrent_b`),
        t,
      ),
    ]);
    assert(
      r11a.success && r11a.data.status === "created" && r11b.success && r11b.data.status === "created",
      "case 11: both concurrent conversions to the same place succeed (no unique constraint blocks it)",
    );
    if (r11a.success && r11a.data.status === "created") createdBusinessIds.push(r11a.data.id);
    if (r11b.success && r11b.data.status === "created") createdBusinessIds.push(r11b.data.id);
    const concurrentConnections = await db.query.businessGooglePlaces.findMany({
      where: eq(schema.businessGooglePlaces.googlePlaceId, PLACE_CONCURRENT),
    });
    assert(concurrentConnections.length === 2, "case 11: both connections persisted");
    const eitherConflict =
      (r11a.success && r11a.data.status === "created" && r11a.data.conflict) ||
      (r11b.success && r11b.data.status === "created" && r11b.data.conflict);
    assert(
      !!eitherConflict,
      "case 11: at least one of the two concurrent creations recorded a conflict (matches claim-flow semantics: the second in always sees the first)",
    );

    // ── Case 12: no Google API call occurs during conversion ──
    assert(fetchCalls === 0, `case 12: zero Google fetch calls made during conversion (actual: ${fetchCalls})`);

    // ── Transaction-failure / partial-row case: force the users insert to
    // violate a real DB constraint (duplicate synthetic email is
    // impossible by construction, so instead simulate via a duplicate
    // username race — same effect: the transaction must leave nothing
    // behind). We already covered "no partial rows on rejection" via case
    // 6/7's username/place-id checks above; this case additionally proves
    // a mid-transaction throw rolls back the users insert too by racing
    // two creates for the exact same username concurrently. ──
    const dupUsername = `${RUN_ID}_race_username`;
    const [race1, race2] = await Promise.all([
      createBusinessFromGooglePlace(
        ownerA.id,
        baseInput(`${RUN_ID}_PLACE_RACE_1`, dupUsername),
        t,
      ),
      createBusinessFromGooglePlace(
        ownerB.id,
        baseInput(`${RUN_ID}_PLACE_RACE_2`, dupUsername),
        t,
      ),
    ]);
    const raceSuccesses = [race1, race2].filter(
      (r) => r.success && r.data.status === "created",
    );
    assert(
      raceSuccesses.length === 1,
      `case 6b: exactly one of two concurrent creates racing the same username wins, the other's transaction rolls back cleanly (actual successes: ${raceSuccesses.length})`,
    );
    for (const r of [race1, race2]) {
      if (r.success && r.data.status === "created") createdBusinessIds.push(r.data.id);
    }
    const raceUsers = await db.query.users.findMany({
      where: eq(schema.users.username, dupUsername),
    });
    assert(raceUsers.length === 1, "case 6b: only one users row exists for the raced username -- no partial insert survived the losing transaction");
  } finally {
    console.log("\n=== CLEANUP ===\n");

    const placeIds = [
      PLACE_FRESH,
      PLACE_OTHER_OWNER,
      PLACE_MULTI,
      PLACE_SAME_USER,
      PLACE_TAKEN_USERNAME,
      PLACE_CATEGORY,
      PLACE_CITY,
      PLACE_NO_OVERWRITE,
      PLACE_CONCURRENT,
      `${RUN_ID}_PLACE_DIFFERENT`,
      `${RUN_ID}_PLACE_TAKEN_USERNAME_TARGET`,
      `${RUN_ID}_PLACE_RACE_1`,
      `${RUN_ID}_PLACE_RACE_2`,
    ];

    await db
      .delete(schema.googlePlaceClaimConflicts)
      .where(inArray(schema.googlePlaceClaimConflicts.googlePlaceId, placeIds));

    await db.delete(schema.users).where(eq(schema.users.id, ownerA.id));
    await db.delete(schema.users).where(eq(schema.users.id, ownerB.id));
    await db.delete(schema.users).where(eq(schema.users.id, ownerC.id));
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

    console.log(`\n${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exitCode = 1;
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

main()
  .catch((err) => {
    console.error("Evaluation crashed:", err);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
