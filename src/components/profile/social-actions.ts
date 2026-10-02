"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { follows, reviews, type Business } from "@/db/schema";
import { getFreshSession } from "@/lib/auth/session";
import { findPublicBusiness, isMine } from "@/lib/data/businesses";
import type { MessageKey } from "@/lib/i18n/types";
import { rateLimit } from "@/lib/rate-limit";
import { reviewSchema } from "@/lib/reviews";

export type SocialResult = { ok: true } | { ok: false; error: MessageKey };

const handle = z.string().min(1).max(50);

type Prepared =
  | { error: MessageKey }
  | { userId: string; business: Business };

/**
 * The signed-in, active user and the business behind `username` — or the
 * error to show. Actions are public endpoints: every input is checked here.
 */
async function prepare(
  username: unknown,
  limitKey: string,
  max: number,
): Promise<Prepared> {
  const session = await getFreshSession();
  if (!session || session.user.status === "suspended") {
    return { error: "Please sign in again." };
  }
  const parsed = handle.safeParse(username);
  if (!parsed.success) {
    return { error: "Something went wrong. Please try again." };
  }
  const userId = session.user.id;
  if (!(await rateLimit(`${limitKey}:${userId}`, max, 60 * 60))) {
    return { error: "Too many attempts. Please wait a moment." };
  }
  const business = await findPublicBusiness(parsed.data);
  if (!business) {
    return { error: "This business no longer exists." };
  }
  return { userId, business };
}

/** Follows (`follow` = true) or unfollows a business. Idempotent. */
export async function setFollowing(
  username: unknown,
  follow: unknown,
): Promise<SocialResult> {
  if (typeof follow !== "boolean") {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const ready = await prepare(username, "follow", 200);
  if ("error" in ready) return { ok: false, error: ready.error };
  const { userId, business } = ready;

  if (follow) {
    await db
      .insert(follows)
      .values({ userId, businessId: business.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(follows)
      .where(
        and(eq(follows.userId, userId), eq(follows.businessId, business.id)),
      );
  }
  revalidatePath(`/bs/${business.username}`);
  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Posts your review of a business, or updates it if you already wrote one
 * (one per user per business). Not for a business you own or added.
 */
export async function postReview(
  username: unknown,
  input: unknown,
): Promise<SocialResult> {
  const ready = await prepare(username, "review", 30);
  if ("error" in ready) return { ok: false, error: ready.error };
  const { userId, business } = ready;

  if (isMine(business, userId)) {
    return { ok: false, error: "You can't review your own business." };
  }
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  await db
    .insert(reviews)
    .values({ businessId: business.id, authorId: userId, ...parsed.data })
    .onConflictDoUpdate({
      target: [reviews.businessId, reviews.authorId],
      set: { ...parsed.data, updatedAt: new Date() },
    });
  revalidatePath(`/bs/${business.username}`, "layout");
  return { ok: true };
}
