"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { businessFollows, businessReviews, type Business } from "@/db/schema";
import { done, fail, type ActionResult } from "@/lib/action-result";
import { runAction } from "@/server/run-action";
import { getFreshSession } from "@/lib/auth/session";
import { findPublicBusiness, isMine } from "@/server/queries/businesses";
import type { MessageKey } from "@/lib/i18n/types";
import { rateLimit } from "@/server/rate-limit";
import { reviewSchema } from "@/lib/validations/review-form";

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
  if (!session || session.user.status !== "active") {
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
): Promise<ActionResult> {
  if (typeof follow !== "boolean") {
    return fail("Something went wrong. Please try again.");
  }
  const ready = await prepare(username, "follow", 200);
  if ("error" in ready) return fail(ready.error);
  const { userId, business } = ready;

  await runAction(
    { action: follow ? "business.follow" : "business.unfollow", actorId: userId, input: { businessId: business.id } },
    async (tx) => {
      if (follow) {
        await tx.insert(businessFollows).values({ userId, businessId: business.id }).onConflictDoNothing();
      } else {
        await tx
          .delete(businessFollows)
          .where(and(eq(businessFollows.userId, userId), eq(businessFollows.businessId, business.id)));
      }
    },
  );
  revalidatePath(`/bs/${business.username}`);
  revalidatePath("/profile");
  return done();
}

/**
 * Posts your review of a business, or updates it if you already wrote one
 * (one per user per business). Not for a business you own or added.
 */
export async function postReview(
  username: unknown,
  input: unknown,
): Promise<ActionResult> {
  const ready = await prepare(username, "review", 30);
  if ("error" in ready) return fail(ready.error);
  const { userId, business } = ready;

  if (isMine(business, userId)) {
    return fail("You can't review your own business.");
  }
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Something went wrong. Please try again.");
  }

  await runAction(
    { action: "review.write", actorId: userId, input: { businessId: business.id, rating: parsed.data.rating } },
    (tx) =>
      tx
        .insert(businessReviews)
        .values({ businessId: business.id, authorId: userId, ...parsed.data })
        .onConflictDoUpdate({
          target: [businessReviews.businessId, businessReviews.authorId],
          set: { ...parsed.data, updatedAt: new Date() },
        }),
  );
  revalidatePath(`/bs/${business.username}`, "layout");
  return done();
}

/**
 * Deletes your review of a business. A hidden one stays: deleting it and
 * writing again would bring it back.
 */
export async function deleteReview(username: unknown): Promise<ActionResult> {
  const ready = await prepare(username, "review", 30);
  if ("error" in ready) return fail(ready.error);
  const { userId, business } = ready;

  const deleted = await runAction(
    { action: "review.delete", actorId: userId, input: { businessId: business.id } },
    (tx) =>
      tx
        .delete(businessReviews)
        .where(
          and(
            eq(businessReviews.businessId, business.id),
            eq(businessReviews.authorId, userId),
            eq(businessReviews.status, "visible"),
          ),
        )
        .returning({ id: businessReviews.id }),
  );
  if (!deleted.length) {
    return fail("Something went wrong. Please try again.");
  }
  revalidatePath(`/bs/${business.username}`, "layout");
  return done();
}
