import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { db, schema } from "@/db";

/**
 * Shared read helpers for the profile/follow pages — kept in one place so
 * `account/page.tsx`'s counts and `followers/following/page.tsx`'s lists
 * never drift out of sync on what "following" means.
 */
export async function getUserByUsername(username: string) {
  return db.query.users.findFirst({ where: eq(schema.users.username, username) });
}

export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    db.$count(schema.follows, eq(schema.follows.followingId, userId)),
    db.$count(schema.follows, eq(schema.follows.followerId, userId)),
  ]);
  return { followers, following };
}

export async function getFollowers(userId: string) {
  const rows = await db.query.follows.findMany({
    where: eq(schema.follows.followingId, userId),
    with: { follower: true },
    orderBy: (follows, { desc }) => [desc(follows.createdAt)],
  });
  return rows.map((r) => r.follower);
}

export async function getFollowing(userId: string) {
  const rows = await db.query.follows.findMany({
    where: eq(schema.follows.followerId, userId),
    with: { following: true },
    orderBy: (follows, { desc }) => [desc(follows.createdAt)],
  });
  return rows.map((r) => r.following);
}

/** Kept out of any component body — comparing against "now" is a side
 * effect a render function isn't allowed to perform directly. */
export function isNotificationsPaused(pausedUntil: Date | null): boolean {
  return !!pausedUntil && pausedUntil.getTime() > Date.now();
}

/** Batch version of `isFollowing` for lists (the feed, a thread's
 * replies, ...) — one query for every author on the page instead of one
 * per row. */
export async function getFollowingIds(
  followerId: string,
  targetIds: string[],
): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const rows = await db.query.follows.findMany({
    where: and(
      eq(schema.follows.followerId, followerId),
      inArray(schema.follows.followingId, targetIds),
    ),
    columns: { followingId: true },
  });
  return new Set(rows.map((r) => r.followingId));
}

export async function isFollowing(followerId: string, followingId: string) {
  const row = await db.query.follows.findFirst({
    where: and(
      eq(schema.follows.followerId, followerId),
      eq(schema.follows.followingId, followingId),
    ),
    columns: { id: true },
  });
  return !!row;
}
