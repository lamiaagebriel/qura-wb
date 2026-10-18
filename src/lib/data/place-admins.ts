import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { placeAdmins, posts, users } from "@/db/schema";

import { hiddenReason } from "./posts";
import { placeAdminQueue } from "./tickets";

/** The ids of the places `userId` looks after. */
export const adminPlaceIds = cache(async (userId: string): Promise<string[]> => {
  const rows = await db
    .select({ placeId: placeAdmins.placeId })
    .from(placeAdmins)
    .where(eq(placeAdmins.userId, userId));
  return rows.map((row) => row.placeId);
});

/** `userId` looks after `placeId` (that place only, not the ones inside it). */
export async function isPlaceAdmin(userId: string, placeId: string) {
  return (await adminPlaceIds(userId)).includes(placeId);
}

export type PlaceAdminRow = {
  userId: string;
  name: string;
  username: string;
  image: string | null;
  since: Date;
};

/** A place's admins, earliest first. */
export async function adminsOf(placeId: string): Promise<PlaceAdminRow[]> {
  return db
    .select({
      userId: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      since: placeAdmins.createdAt,
    })
    .from(placeAdmins)
    .innerJoin(users, eq(users.id, placeAdmins.userId))
    .where(eq(placeAdmins.placeId, placeId))
    .orderBy(asc(placeAdmins.createdAt));
}

/** Hidden posts their authors edited since, in these places: waiting for another look. */
export async function postsUnderReview(placeIds: string[] | "all") {
  if (placeIds !== "all" && !placeIds.length) return [];
  return db
    .select({ id: posts.id, body: posts.body, placeId: posts.placeId, hiddenReason, author: { name: users.name } })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.createdById))
    .where(and(eq(posts.status, "under_review"), placeIds === "all" ? undefined : inArray(posts.placeId, placeIds)))
    .orderBy(asc(posts.updatedAt));
}

/** What waits for `userId` as a place admin (the "My places" count). */
export async function placeAdminQueueCount(userId: string): Promise<number> {
  const mine = await adminPlaceIds(userId);
  if (!mine.length) return 0;
  const [queue, review] = await Promise.all([placeAdminQueue(userId, mine), postsUnderReview(mine)]);
  return queue.length + review.length;
}
