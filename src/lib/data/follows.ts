import "server-only";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { follows } from "@/db/schema";

/** Whether this user follows this business. */
export async function isFollowing(userId: string, businessId: string) {
  const [row] = await db
    .select({ userId: follows.userId })
    .from(follows)
    .where(and(eq(follows.userId, userId), eq(follows.businessId, businessId)))
    .limit(1);
  return !!row;
}

/** How many businesses this user follows (their Profile tab). */
export async function followingCount(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(follows)
    .where(eq(follows.userId, userId));
  return row.count;
}
