"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db, schema } from "@/db";
import { getGuardedUser } from "@/lib/auth/guard";
import { fail, messageError, ok, type ActionResult } from "@/lib/errors";
import { isValidId } from "@/lib/id";
import { getLocale } from "@/lib/i18n/actions";

export async function likeThreadAction(threadId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  await db
    .insert(schema.threadLikes)
    .values({ userId: user.id, threadId })
    .onConflictDoNothing();

  revalidatePath("/");
  revalidatePath(`/thread/${threadId}`);
  return ok(undefined);
}

export async function unlikeThreadAction(threadId: string): Promise<ActionResult> {
  const [user, { t }] = await Promise.all([getGuardedUser(), getLocale()]);
  if (!user) return fail(messageError(t("You need to sign in to do that.")));
  if (!isValidId(threadId)) {
    return fail(messageError(t("Something went wrong. Please try again.")));
  }

  await db
    .delete(schema.threadLikes)
    .where(
      and(
        eq(schema.threadLikes.userId, user.id),
        eq(schema.threadLikes.threadId, threadId),
      ),
    );

  revalidatePath("/");
  revalidatePath(`/thread/${threadId}`);
  return ok(undefined);
}
