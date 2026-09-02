import { createdAt, id, pgTable, references, varchar } from "@/db/helpers";
import { index, pgEnum } from "drizzle-orm/pg-core";

import { users } from "./users";

// Lifecycle for an admin reviewing a conflict — "conflict" is what every
// new connection-sharing event is written as (see
// `lib/business/google-place-claims.ts`); "resolved"/"dismissed" are set
// only by an admin action (Phase 5), never automatically.
export const CLAIM_CONFLICT_STATUSES = ["conflict", "resolved", "dismissed"] as const;
export const claimConflictStatusEnum = pgEnum(
  "google_place_claim_conflict__status",
  CLAIM_CONFLICT_STATUSES,
);
export type ClaimConflictStatus = (typeof CLAIM_CONFLICT_STATUSES)[number];

/**
 * One row per "another Qura business already connects to this Google
 * place" event — written whenever a business successfully connects to a
 * place that at least one *other* business already had (see
 * `lib/business/google-place-claims.ts`). As of Phase 5, connecting never
 * fails because of this: the new connection still succeeds, this row is
 * purely an admin-visible audit trail, not a rejection record. Not
 * written for an available (unconnected) place, and not written when a
 * business reconnects to its own already-connected place (idempotent, not
 * an event).
 *
 * All four `users.id` columns are `ON DELETE SET NULL`, not cascade:
 * deleting a business or account should never erase the historical fact
 * that a duplicate connection happened — only who was involved. An admin
 * reading an old record after one side is gone still sees the event and
 * the Google place id, just with that particular participant column
 * blank.
 */
export const googlePlaceClaimConflicts = pgTable(
  "google_place_claim_conflicts",
  {
    ...id,
    ...createdAt,

    googlePlaceId: varchar("google_place_id").notNull(),

    // The business that attempted the claim and lost, and the real
    // account that made the attempt on its behalf (a business profile has
    // no login of its own — see `users.ts` — so "who did this" is always
    // the owner, not the business row).
    attemptingBusinessId: references({
      k: "attempting_business_id",
      ref: users.id,
      actions: { onDelete: "set null" },
    }),
    attemptingOwnerId: references({
      k: "attempting_owner_id",
      ref: users.id,
      actions: { onDelete: "set null" },
    }),

    // The business that already held a connection to this place at the
    // moment of the event, and its owner.
    existingBusinessId: references({
      k: "existing_business_id",
      ref: users.id,
      actions: { onDelete: "set null" },
    }),
    existingOwnerId: references({
      k: "existing_owner_id",
      ref: users.id,
      actions: { onDelete: "set null" },
    }),

    status: claimConflictStatusEnum("status").notNull().default("conflict"),
  },
  (t) => [
    index("google_place_claim_conflict__google_place_id__idx").on(
      t.googlePlaceId,
    ),
    index("google_place_claim_conflict__attempting_business_id__idx").on(
      t.attemptingBusinessId,
    ),
    index("google_place_claim_conflict__existing_business_id__idx").on(
      t.existingBusinessId,
    ),
    index("google_place_claim_conflict__status__idx").on(t.status),
    // The admin list is sorted newest-first by default.
    index("google_place_claim_conflict__created_at__idx").on(t.createdAt),
  ],
);

export type GooglePlaceClaimConflict =
  typeof googlePlaceClaimConflicts.$inferSelect;
