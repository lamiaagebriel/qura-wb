"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import {
  fail,
  messageError,
  ok,
  zodIssuesError,
  type ActionResult,
} from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";
import { createReviewSchema, type ReviewValues } from "@/lib/validations/review";

/** One review per (business, author) — a second submit updates the
 * first (see the DB's unique `(business_id, author_id)` index), so this
 * is always an upsert, never a create-vs-update branch the caller has
 * to get right. */
export async function upsertReviewAction(
  businessId: string,
  values: ReviewValues,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(businessId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const business = await db.query.users.findFirst({
    where: eq(schema.users.id, businessId),
    columns: { id: true, ownerId: true, username: true },
  });
  if (!business?.ownerId) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }
  if (business.ownerId === user.id) {
    return fail(messageError(t("You can't review your own business.")));
  }

  const parsed = createReviewSchema(t).safeParse(values);
  if (!parsed.success) return fail(zodIssuesError(parsed.error));

  await db
    .insert(schema.businessReviews)
    .values({
      businessId,
      authorId: user.id,
      rating: parsed.data.rating,
      body: parsed.data.body || null,
    })
    .onConflictDoUpdate({
      target: [
        schema.businessReviews.businessId,
        schema.businessReviews.authorId,
      ],
      set: { rating: parsed.data.rating, body: parsed.data.body || null },
    });

  revalidatePath(`/profile/${business.username}`);
  return ok(undefined);
}

export async function deleteReviewAction(
  reviewId: string,
): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(reviewId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const [deleted] = await db
    .delete(schema.businessReviews)
    .where(
      and(
        eq(schema.businessReviews.id, reviewId),
        eq(schema.businessReviews.authorId, user.id),
      ),
    )
    .returning({ businessId: schema.businessReviews.businessId });
  if (!deleted) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  const business = await db.query.users.findFirst({
    where: eq(schema.users.id, deleted.businessId),
    columns: { username: true },
  });
  if (business) revalidatePath(`/profile/${business.username}`);

  return ok(undefined);
}
