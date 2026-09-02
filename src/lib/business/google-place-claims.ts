import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Phase 5 model: connecting a Google Place no longer means "claiming
 * exclusive ownership" — multiple Qura businesses may legitimately share
 * one Google Place. Connecting therefore essentially never fails on
 * account of another business already being connected; it always
 * succeeds and flags whether it was the first connection or one of
 * several (`conflict: true`), which is what makes the event admin-visible
 * via `google_place_claim_conflicts`.
 *
 * Phase 24: a business itself may now hold MULTIPLE connections at once
 * (`business_google_places` — one row per business+place, physical
 * branches each with their own Google listing), so
 * `"already_connected_elsewhere"` (Phase 5–23's "must disconnect first")
 * no longer exists as a rejection case — adding a new place never
 * requires giving up an existing one. The only way connecting still
 * *doesn't* succeed is this business having no `business_blocks` row yet
 * (no category chosen) — there's nowhere to associate the connection
 * with — or the exact same (business, place) pair already existing
 * (idempotent, not an error).
 */
export type ClaimGooglePlaceResult =
  | { status: "connected"; conflict: boolean }
  | { status: "already_connected" }
  | { status: "no_block" };

/** Earliest OTHER business currently connected to a place, if any — used
 * both by `claimGooglePlaceForBusiness` (below) and the Google-only →
 * Qura conversion flow (`google-place-conversion.ts`), which sets up its
 * own row in `business_google_places` directly inside its own
 * transaction rather than going through `claimGooglePlaceForBusiness`
 * itself. */
export async function findExistingConnectedBusiness(
  googlePlaceId: string,
  excludeBusinessId: string,
) {
  return db.query.businessGooglePlaces.findFirst({
    where: and(
      eq(schema.businessGooglePlaces.googlePlaceId, googlePlaceId),
      ne(schema.businessGooglePlaces.businessId, excludeBusinessId),
    ),
    orderBy: [asc(schema.businessGooglePlaces.createdAt)],
    with: { business: { columns: { ownerId: true } } },
  });
}

/** Records that a new connection joined a place at least one other
 * business already held — an audit event, not a rejection. One row per
 * connection event, referencing the *earliest* other connected business
 * (by `createdAt`) as `existingBusinessId`/`existingOwnerId` — an admin
 * reviewing it sees who was there first, and can see every currently
 * connected business (not just this one) by looking the place id up
 * directly in `business_google_places`, which always reflects the live
 * set. */
export async function recordDuplicateConnection(params: {
  googlePlaceId: string;
  attemptingBusinessId: string;
  attemptingOwnerId: string;
  existingBusinessId: string;
  existingOwnerId: string;
}) {
  await db.insert(schema.googlePlaceClaimConflicts).values(params);
}

/**
 * Adds a Google Place connection (a "branch") to a business, or reports
 * why it can't.
 *
 * No database-level uniqueness backs "how many other businesses share
 * this place" — the only thing `unique(businessId, googlePlaceId)`
 * actually enforces is that THIS business can't add the exact same place
 * twice. Callers must have already verified `ownerId` actually owns
 * `businessId` — this function trusts both ids completely, the same as
 * every other `lib/business` write function does. No Google API call
 * happens here — a caller that wants to validate the place with Google
 * should do so *before* calling this, not inside it.
 */
export async function claimGooglePlaceForBusiness({
  businessId,
  ownerId,
  googlePlaceId,
}: {
  businessId: string;
  ownerId: string;
  googlePlaceId: string;
}): Promise<ClaimGooglePlaceResult> {
  const own = await db.query.businessBlocks.findFirst({
    where: eq(schema.businessBlocks.businessId, businessId),
  });
  if (!own) return { status: "no_block" };

  const alreadyThere = await db.query.businessGooglePlaces.findFirst({
    where: and(
      eq(schema.businessGooglePlaces.businessId, businessId),
      eq(schema.businessGooglePlaces.googlePlaceId, googlePlaceId),
    ),
  });
  if (alreadyThere) return { status: "already_connected" };

  // Earliest other business already connected to this place, if any —
  // read before the write so the count/identity reflects the state this
  // connection is actually joining, not a state it just created.
  const existing = await findExistingConnectedBusiness(googlePlaceId, businessId);

  const [inserted] = await db
    .insert(schema.businessGooglePlaces)
    .values({ businessId, googlePlaceId })
    .onConflictDoNothing()
    .returning({ id: schema.businessGooglePlaces.id });

  // Lost a race against a concurrent identical request — the other one
  // already inserted the exact same (business, place) row. Idempotent,
  // not an error, and nothing new to record.
  if (!inserted) return { status: "already_connected" };

  if (existing) {
    await recordDuplicateConnection({
      googlePlaceId,
      attemptingBusinessId: businessId,
      attemptingOwnerId: ownerId,
      existingBusinessId: existing.businessId,
      // A `business_google_places` row only ever exists for a business
      // profile (`ownerId IS NOT NULL` — see `users.ts`), so this is
      // always set.
      existingOwnerId: existing.business.ownerId!,
    });
    return { status: "connected", conflict: true };
  }

  return { status: "connected", conflict: false };
}

/** Removes one specific branch connection — a no-op if that business
 * never had this exact place connected. Business- and place-scoped: it
 * never touches this business's OTHER connections, and never touches
 * another business's connection to the same place. */
export async function disconnectGooglePlaceForBusiness(
  businessId: string,
  googlePlaceId: string,
): Promise<void> {
  await db
    .delete(schema.businessGooglePlaces)
    .where(
      and(
        eq(schema.businessGooglePlaces.businessId, businessId),
        eq(schema.businessGooglePlaces.googlePlaceId, googlePlaceId),
      ),
    );
}
