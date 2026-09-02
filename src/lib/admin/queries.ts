import "server-only";

import { desc, eq } from "drizzle-orm";

import { db, schema } from "@/db";

const PAGE_SIZE = 20;

// Business identity is already public (profile pages show it to anyone);
// the owner's account fields below are NOT — those are only ever fetched
// for this admin-only module, never for a business-facing action.
const PUBLIC_BUSINESS_COLUMNS = { id: true, name: true, username: true, image: true } as const;
const ADMIN_OWNER_COLUMNS = { id: true, name: true, username: true, email: true } as const;

/** Newest-first, paginated — the admin conflict list. */
export async function getGooglePlaceConflicts(cursor = 0) {
  const rows = await db.query.googlePlaceClaimConflicts.findMany({
    orderBy: [desc(schema.googlePlaceClaimConflicts.createdAt)],
    limit: PAGE_SIZE + 1,
    offset: cursor,
    with: {
      attemptingBusiness: { columns: PUBLIC_BUSINESS_COLUMNS },
      existingBusiness: { columns: PUBLIC_BUSINESS_COLUMNS },
    },
  });

  const hasMore = rows.length > PAGE_SIZE;
  return {
    items: rows.slice(0, PAGE_SIZE),
    nextCursor: hasMore ? cursor + PAGE_SIZE : null,
  };
}

export async function getGooglePlaceConflictById(id: string) {
  return db.query.googlePlaceClaimConflicts.findFirst({
    where: eq(schema.googlePlaceClaimConflicts.id, id),
    with: {
      attemptingBusiness: { columns: PUBLIC_BUSINESS_COLUMNS },
      attemptingOwner: { columns: ADMIN_OWNER_COLUMNS },
      existingBusiness: { columns: PUBLIC_BUSINESS_COLUMNS },
      existingOwner: { columns: ADMIN_OWNER_COLUMNS },
    },
  });
}

/** The Phase 7 cache row for a place, if one exists — `null` if it's
 * never been successfully fetched. Read-only, admin-only: gives an admin
 * `fetchedAt`/cache age without going through `getCachedGooglePlace`
 * (which would attempt a live refresh — an admin viewing this page isn't
 * a reason to spend Google quota). Deliberately does NOT surface a
 * failure history — Phase 7 has no `errorStatus`/`lastError` column on
 * purpose (a fetch failure is transient metadata about one read attempt,
 * not persisted place data), and Phase 14 kept that decision rather than
 * reversing it just for this admin view. */
export async function getCachedPlaceInfo(googlePlaceId: string) {
  const row = await db.query.googlePlacesCache.findFirst({
    where: eq(schema.googlePlacesCache.placeId, googlePlaceId),
  });
  if (!row) return null;
  // Computed here, not in the page component — `Date.now()` during a
  // component's render body trips this repo's react-compiler purity
  // lint rule; a plain data-layer function has no such restriction.
  return { ...row, cacheAgeMs: Date.now() - row.fetchedAt.getTime() };
}

/** Every Qura business currently connected to a place, oldest first — the
 * LIVE set, not just the two businesses one particular conflict row
 * references. With Phase 5's many-to-one model this can be more than two
 * (A, B, C, D all connected to the same place) — an admin reviewing one
 * conflict record should still see the complete current picture, not just
 * the pair involved in that one historical event. Phase 24: a single
 * business can now appear here more than once if it connected the same
 * place as more than one branch — impossible in practice
 * (`unique(businessId, googlePlaceId)`), so this is always one row per
 * distinct business. */
export async function getBusinessesConnectedToPlace(googlePlaceId: string) {
  return db.query.businessGooglePlaces.findMany({
    where: eq(schema.businessGooglePlaces.googlePlaceId, googlePlaceId),
    orderBy: (rows, { asc }) => [asc(rows.createdAt)],
    with: { business: { columns: PUBLIC_BUSINESS_COLUMNS } },
  });
}
