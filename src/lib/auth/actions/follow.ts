"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

import { getGuardedUser } from "../guard";

export async function followAction(targetUserId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(targetUserId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }
  if (user.id === targetUserId) {
    return fail(messageError(t("You can't follow yourself.")));
  }

  await db
    .insert(schema.follows)
    .values({ followerId: user.id, followingId: targetUserId })
    .onConflictDoNothing();

  revalidatePath("/account/followers");
  revalidatePath("/account/following");
  return ok(undefined);
}

export async function unfollowAction(targetUserId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(targetUserId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  await db
    .delete(schema.follows)
    .where(
      and(
        eq(schema.follows.followerId, user.id),
        eq(schema.follows.followingId, targetUserId),
      ),
    );

  revalidatePath("/account/followers");
  revalidatePath("/account/following");
  return ok(undefined);
}
