"use server";

import type { ThreadCategory } from "@/db/schema";
import { getActiveCity } from "@/lib/city/actions";
import { getCurrentUser } from "@/lib/auth/guard";
import {
  getFeedThreads,
  getThreadReplies,
  getUserReplies,
  getUserThreads,
  type FeedSort,
  type ReplySort,
} from "@/lib/threads/queries";

/**
 * One "load the next page" action per list — called directly from client
 * components as scroll reaches the sentinel (`useInfiniteList`), not tied
 * to a form. Each re-derives the viewer from the session itself rather
 * than trusting a client-supplied id, same as every other action in this
 * app that needs "who's asking".
 */
export async function loadMoreFeedAction(
  cursor: number,
  sort: FeedSort,
  category?: ThreadCategory,
) {
  const [user, city] = await Promise.all([getCurrentUser(), getActiveCity()]);
  return getFeedThreads(city, user?.id, cursor, sort, category);
}

export async function loadMoreThreadRepliesAction(
  threadId: string,
  sort: ReplySort,
  cursor: number,
) {
  const user = await getCurrentUser();
  return getThreadReplies(threadId, { sort, cursor, viewerId: user?.id });
}

export async function loadMoreUserThreadsAction(userId: string, cursor: number) {
  const user = await getCurrentUser();
  return getUserThreads(userId, user?.id, cursor);
}

export async function loadMoreUserRepliesAction(userId: string, cursor: number) {
  const user = await getCurrentUser();
  return getUserReplies(userId, user?.id, cursor);
}
