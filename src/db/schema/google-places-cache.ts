import { pgTable, text, timestamp, varchar } from "@/db/helpers";
import { integer, jsonb, real } from "drizzle-orm/pg-core";

/**
 * Phase 7 — a pure freshness layer, NOT an identity table. `placeId` is
 * the primary key (Google's own opaque id, never Qura-generated), and
 * this table has no relation to `users`/`business_blocks` at all: any
 * number of `business_blocks` rows may reference a place here via their
 * own `googlePlaceId` column, and this row's lifecycle is completely
 * independent of how many (if any) currently do. Disconnecting a
 * business never touches this table — see
 * `lib/business/google-place-cache.ts`, which is the only code that
 * reads/writes it.
 *
 * `fetchedAt`/`updatedAt` are deliberately NOT the shared `createdAt`/
 * `updatedAt` helpers from `db/helpers.ts` (those auto-touch on every
 * write) — both are only ever set by the application on a *successful*
 * Google fetch, which is what lets "how old is this data" be computed
 * correctly. A failed refresh attempt leaves both untouched, so retrying
 * repeatedly can never make stale data masquerade as fresh.
 *
 * No `errorStatus`/`lastError` column on purpose — a fetch failure is
 * transient metadata about one read attempt, not a property of the
 * place's own data, and doesn't belong persisted here (see
 * `google-place-cache.ts`'s `GooglePlaceCacheResult`, which carries the
 * failure reason only in the in-memory result of the read that hit it).
 *
 * `refreshLockedUntil` (Phase 14) — the cache-stampede guard. When a
 * request finds a row stale, it atomically claims the refresh via
 * `UPDATE ... WHERE refresh_locked_until IS NULL OR refresh_locked_until
 * < now() ... RETURNING`; only the request whose `UPDATE` actually
 * matched a row goes on to call Google. Every other concurrent request
 * for the same place serves the existing stale data immediately instead
 * of independently calling Google or waiting. Deliberately NOT a real
 * Postgres advisory lock (`pg_try_advisory_lock`/`_xact_lock`) — see
 * `google-place-cache.ts`'s comment for why that's unsafe/impractical
 * against this app's production connection pooler. Self-expiring (a
 * short TTL, not held open across the Google request itself in any
 * transaction) so a crashed refresh attempt can't wedge a place stale
 * forever.
 */
// A plain table, not `pgTable` from `db/helpers` with the shared `id`
// helper — this row's identity is `placeId` itself (Google's string,
// never a Qura-generated uuid), so there's no separate surrogate key.
export const googlePlacesCache = pgTable("google_places", {
  placeId: varchar("place_id").primaryKey(),

  name: varchar("name").notNull(),
  address: text("address"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  types: text("types").array().notNull().default([]),
  rating: real("rating"),
  userRatingCount: integer("user_rating_count"),
  businessStatus: varchar("business_status"),
  phone: varchar("phone"),
  website: text("website"),
  // `{ openNow?: boolean; weekdayDescriptions?: string[] }` — same shape
  // as `GooglePlaceOpeningHours` (`lib/google-places/types.ts`), stored
  // as-is rather than split into columns since it's never queried on,
  // only ever read back whole.
  openingHours: jsonb("opening_hours"),

  fetchedAt: timestamp("fetched_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),

  refreshLockedUntil: timestamp("refresh_locked_until"),
});

export type GooglePlaceCacheRow = typeof googlePlacesCache.$inferSelect;
