import "server-only";

import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";

/** Every business profile a real account controls, newest first — the
 * settings list and the composer's "post as" picker both need exactly
 * this. `eq(ownerId, ownerId)` alone already implies "this is a
 * business" (a real account's `ownerId` is always null), so there's
 * nothing else to check. */
export async function getMyBusinesses(ownerId: string) {
  return db.query.users.findMany({
    where: eq(schema.users.ownerId, ownerId),
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

/** A single owned business, for the edit page — `null` if it doesn't
 * exist or isn't owned by `ownerId`, which the caller treats as "not
 * found" either way rather than distinguishing the two. */
export async function getMyBusinessById(id: string, ownerId: string) {
  return db.query.users.findFirst({
    where: and(eq(schema.users.id, id), eq(schema.users.ownerId, ownerId)),
  });
}

/** `[yourOwnId, ...everyBusinessYouOwn]` — the full set of author ids a
 * thread action should treat as "yours" for an ownership check, since a
 * thread posted "as" a business is authored by that business's row, not
 * by you directly. */
export async function getOwnedAuthorIds(ownerId: string): Promise<string[]> {
  const businesses = await getMyBusinesses(ownerId);
  return [ownerId, ...businesses.map((b) => b.id)];
}
