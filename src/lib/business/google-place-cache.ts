import "server-only";

import { and, eq, isNull, lt, or } from "drizzle-orm";
import * as z from "zod";

import { db, schema } from "@/db";
import { getGooglePlaceDetails } from "@/lib/google-places/details";
import { GooglePlacesError, type GooglePlacesErrorCode } from "@/lib/google-places/errors";
import type {
  GooglePlaceDetails,
  GooglePlaceOpeningHours,
} from "@/lib/google-places/types";
import { logEvent, logWarning, withTiming } from "@/lib/observability/log";
import type { GooglePlaceCacheRow } from "@/db/schema/google-places-cache";

// Fresh for 24h since the last *successful* fetch; past that, a read
// attempts one refresh (never a background job — explicitly out of scope
// this phase) before falling back to whatever's cached.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Phase 14's cache-stampede guard — see `refreshLockedUntil`'s schema
// comment for why this is a plain claim column, not a real Postgres
// advisory lock. Longer than the Google client's own ~8s request
// timeout so a slow-but-alive request isn't undercut by another request
// re-claiming too early, short enough that a genuinely crashed attempt
// self-recovers quickly rather than wedging a place stale for long.
const REFRESH_CLAIM_MS = 15 * 1000;

/**
 * `unavailable` never means "disconnected" — it means Qura still has a
 * Google Place connection (`business_blocks.googlePlaceId` is untouched
 * either way), but no data, fresh or stale, exists to show right now.
 * `reason` in both non-fresh states is server-diagnostic only — never
 * shown verbatim to a user, same rule every other `GooglePlacesError`
 * consumer already follows. `"refresh_in_progress"` (Phase 14) is the
 * one `reason` that isn't a Google error at all: it means a *different*
 * concurrent request already claimed this place's refresh and this one
 * simply served the existing stale data instead of piling on another
 * Google call.
 */
export type GooglePlaceCacheResult =
  | { status: "fresh"; details: GooglePlaceDetails; fetchedAt: Date }
  | {
      status: "stale";
      details: GooglePlaceDetails;
      fetchedAt: Date;
      reason: GooglePlacesErrorCode | "refresh_in_progress";
    }
  | { status: "unavailable"; reason: GooglePlacesErrorCode };

// Phase 14 — validated on read, not just trusted from the writer. The
// cache writer (`upsertCache` below) always writes this exact shape, but
// reading it back through a schema (rather than an unchecked cast) means
// a malformed row — a manual DB edit, a future migration mistake, a
// differently-shaped value from some other write path — degrades to "no
// opening hours shown" instead of a runtime crash or corrupted-looking
// data reaching the UI. Flagged as a real (if small) risk back in the
// Phase 7 report; this is what closes it.
const openingHoursRowSchema = z
  .object({
    openNow: z.boolean().optional(),
    weekdayDescriptions: z.array(z.string()).optional(),
  })
  .nullable();

function parseOpeningHours(value: unknown): GooglePlaceOpeningHours | undefined {
  const result = openingHoursRowSchema.safeParse(value);
  if (!result.success || !result.data) return undefined;
  return result.data;
}

function rowToDetails(row: GooglePlaceCacheRow): GooglePlaceDetails {
  return {
    placeId: row.placeId,
    name: row.name,
    address: row.address ?? undefined,
    location:
      row.latitude !== null && row.longitude !== null
        ? { latitude: row.latitude, longitude: row.longitude }
        : undefined,
    types: row.types,
    rating: row.rating ?? undefined,
    userRatingCount: row.userRatingCount ?? undefined,
    businessStatus: row.businessStatus ?? undefined,
    phoneNumber: row.phone ?? undefined,
    websiteUri: row.website ?? undefined,
    openingHours: parseOpeningHours(row.openingHours),
  };
}

/** One upsert, keyed on `placeId` — race-safe and idempotent by
 * construction: N concurrent profile views refreshing the same stale
 * place all resolve to the same final row, never a duplicate insert or a
 * lost update. `fetchedAt`/`updatedAt` are only ever set here, from a
 * successful Google response — never touched by a failed attempt.
 * Also clears `refreshLockedUntil` — a fresh row has nothing left to
 * claim. */
async function upsertCache(details: GooglePlaceDetails, now: Date): Promise<void> {
  const values = {
    placeId: details.placeId,
    name: details.name,
    address: details.address ?? null,
    latitude: details.location?.latitude ?? null,
    longitude: details.location?.longitude ?? null,
    types: details.types,
    rating: details.rating ?? null,
    userRatingCount: details.userRatingCount ?? null,
    businessStatus: details.businessStatus ?? null,
    phone: details.phoneNumber ?? null,
    website: details.websiteUri ?? null,
    openingHours: details.openingHours ?? null,
    fetchedAt: now,
    updatedAt: now,
    refreshLockedUntil: null,
  };

  await db
    .insert(schema.googlePlacesCache)
    .values(values)
    .onConflictDoUpdate({ target: schema.googlePlacesCache.placeId, set: values });
}

/**
 * The cache-stampede guard (Phase 14): a single atomic `UPDATE ...
 * RETURNING` that only ever matches (and thus only ever returns a row
 * for) ONE of however many concurrent callers see this place as stale at
 * the same moment — Postgres's own row-level locking during the `UPDATE`
 * is what actually provides the exclusivity, the same mechanism that
 * already makes `upsertCache`'s `ON CONFLICT` race-safe (Phase 8). Every
 * other concurrent caller's `UPDATE` matches zero rows (the predicate no
 * longer holds once the winner's row is visible) and gets told to serve
 * stale data instead of also calling Google.
 *
 * Deliberately not a real Postgres advisory lock
 * (`pg_try_advisory_lock`/`_xact_lock`): a session-scoped advisory lock
 * isn't reliably released under a transaction-mode connection pooler
 * (this app's production `DATABASE_URL` points at Supabase's
 * transaction-mode pooler — see `db/index.ts`'s own comment on exactly
 * this), and a transaction-scoped one would require holding a DB
 * transaction open across the Google network call, tying up this app's
 * one pooled connection per serverless instance (`max: 1`) for as long
 * as ~8 seconds. This claim is one fast statement, no held transaction,
 * self-expiring after `REFRESH_CLAIM_MS`.
 */
async function tryClaimRefresh(placeId: string, now: Date): Promise<boolean> {
  const lockUntil = new Date(now.getTime() + REFRESH_CLAIM_MS);
  const claimed = await db
    .update(schema.googlePlacesCache)
    .set({ refreshLockedUntil: lockUntil })
    .where(
      and(
        eq(schema.googlePlacesCache.placeId, placeId),
        or(
          isNull(schema.googlePlacesCache.refreshLockedUntil),
          lt(schema.googlePlacesCache.refreshLockedUntil, now),
        ),
      ),
    )
    .returning({ placeId: schema.googlePlacesCache.placeId });

  return claimed.length > 0;
}

/**
 * The Phase 7 cache-aware read path — the only code that touches
 * `google_places`. Never mutates `business_blocks.googlePlaceId`; a
 * Google failure here, however severe (missing key, 404, 429, 5xx,
 * timeout), only ever affects what this function returns, never whether
 * a business is considered connected. Disconnecting stays entirely
 * `lib/business/google-place-claims.ts`'s job, untouched by this module.
 *
 * `placeId` is assumed non-empty and already known-connected — callers
 * needing the "not connected at all" case (`googlePlaceId === null`)
 * handle that themselves before calling this (see
 * `lib/business/queries.ts`'s `getBusinessGooglePlaceDetails`).
 */
export async function getCachedGooglePlace(
  placeId: string,
  languageCode?: string,
): Promise<GooglePlaceCacheResult> {
  const row = await db.query.googlePlacesCache.findFirst({
    where: eq(schema.googlePlacesCache.placeId, placeId),
  });

  if (row && Date.now() - row.fetchedAt.getTime() < CACHE_TTL_MS) {
    logEvent("google_place_cache_read", { placeId, status: "fresh" });
    return { status: "fresh", details: rowToDetails(row), fetchedAt: row.fetchedAt };
  }

  // Stampede guard only applies when a row already exists to protect —
  // a burst of first-time requests for a brand-new uncached place still
  // all call Google in parallel once (Phase 8 already proved that's
  // data-safe; it just isn't call-count-optimized, and that's a
  // materially smaller problem than "20 users hit the same already-known
  // STALE place," which is what this guards).
  if (row) {
    const claimed = await tryClaimRefresh(placeId, new Date());
    if (!claimed) {
      logEvent("google_place_cache_refresh_skipped", {
        placeId,
        reason: "refresh_in_progress",
      });
      return {
        status: "stale",
        details: rowToDetails(row),
        fetchedAt: row.fetchedAt,
        reason: "refresh_in_progress",
      };
    }
  }

  try {
    const details = await withTiming(
      "google_place_details_fetch",
      { placeId },
      () => getGooglePlaceDetails(placeId, languageCode),
    );
    const now = new Date();
    await upsertCache(details, now);
    logEvent("google_place_cache_refresh", { placeId, status: "success" });
    return { status: "fresh", details, fetchedAt: now };
  } catch (error) {
    if (!(error instanceof GooglePlacesError)) throw error;

    // Server log only — the UI shows a low-key "may be out of date" /
    // "unavailable right now" note, never this code or message. Never
    // logs the API key or a raw Google response body — only the typed
    // error code this module already normalized to.
    logWarning("google_place_cache_refresh", {
      placeId,
      status: "failed",
      reason: error.code,
    });

    if (row) {
      return {
        status: "stale",
        details: rowToDetails(row),
        fetchedAt: row.fetchedAt,
        reason: error.code,
      };
    }
    return { status: "unavailable", reason: error.code };
  }
}
