import "server-only";

import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { businessFollows } from "@/db/schema";

/** Whether this user businessFollows this business. */
export async function isFollowing(userId: string, businessId: string) {
  const [row] = await db
    .select({ userId: businessFollows.userId })
    .from(businessFollows)
    .where(and(eq(businessFollows.userId, userId), eq(businessFollows.businessId, businessId)))
    .limit(1);
  return !!row;
}

/** How many businesses this user businessFollows (their Profile tab). */
export async function followingCount(userId: string) {
  const [row] = await db
    .select({ count: count() })
    .from(businessFollows)
    .where(eq(businessFollows.userId, userId));
  return row.count;
}
