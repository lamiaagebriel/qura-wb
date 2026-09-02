import {
  createdAt,
  id,
  pgTable,
  references,
  varchar,
} from "@/db/helpers";
import { index, uniqueIndex } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * A business's Google Place connections — one row per connected place,
 * many rows per business. Replaces the old single `business_blocks
 * .googlePlaceId` column (removed in the same migration this table was
 * added in): a business used to be able to connect to at most one Google
 * Place at a time; this table is what lets it connect to several at once
 * (multiple physical branches/locations, each with its own Google
 * listing), while everything about how a *place* behaves is unchanged —
 * `google_places` (the Phase 7 cache) still keys purely on `placeId` and
 * has no idea how many businesses, or how many of a single business's
 * branches, point at it; `google_place_claim_conflicts` still records
 * "another business already held this place" the same way, just sourced
 * from this table instead of `business_blocks`.
 *
 * Deliberately NOT unique on `googlePlaceId` alone, for the exact same
 * Phase 5 reason `business_blocks.googlePlaceId` never was: several
 * different Qura businesses (each possibly multi-branch itself) may
 * legitimately share one Google Place. `unique(businessId, googlePlaceId)`
 * is the only constraint — a business can't add the exact same place
 * twice, but placing no other limit on how many *different* places one
 * business may add, or how many *other* businesses may also point at any
 * one of them.
 */
export const businessGooglePlaces = pgTable(
  "business_google_places",
  {
    ...id,
    ...createdAt,

    businessId: references({
      k: "business_id",
      ref: users.id,
      actions: { onDelete: "cascade" },
    }).notNull(),

    googlePlaceId: varchar("google_place_id").notNull(),

    // Optional, owner-set label for this branch (e.g. "Downtown", "Mall
    // of Aswan") — purely a display convenience, never used for
    // matching/grouping/ranking (that's always `googlePlaceId` equality,
    // same as everywhere else in the Google integration).
    label: varchar("label"),
  },
  (t) => [
    uniqueIndex("business_google_place__business_id__google_place_id__idx").on(
      t.businessId,
      t.googlePlaceId,
    ),
    // Every "who's connected to this place" lookup (search's merge,
    // category discovery, the admin conflict view) filters on this alone.
    index("business_google_place__google_place_id__idx").on(t.googlePlaceId),
    // Every "this business's own branches" lookup (settings page, profile
    // page) filters on this alone.
    index("business_google_place__business_id__idx").on(t.businessId),
  ],
);

export type BusinessGooglePlace = typeof businessGooglePlaces.$inferSelect;
